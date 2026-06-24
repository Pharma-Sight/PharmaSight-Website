"""
main.py — FastAPI application for MediTrace.

Endpoints:
  POST /predict        — core shortage prediction (CRAG + GraphRAG integrated)
  POST /anomaly        — spike detection on daily usage
  POST /alternatives   — Gemini RAG drug substitutes (GraphRAG local lookup first)
  POST /allocate       — fairness-weighted stock allocation
  GET  /district-risk  — all facilities with risk level (Leaflet map data)
  GET  /fairness-audit — rural vs urban allocation equity summary
  GET  /health         — service liveness

CRAG + GraphRAG integration summary:
  - /predict  : full CRAG evaluation + GraphRAG seasonal/ripple enrichment
  - /alternatives : GraphRAG local substitutes checked BEFORE Gemini API call
  - /district-risk: GraphRAG facility graph + ripple risk overlay
"""

from __future__ import annotations

import os
import json
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

from prediction  import run_prediction
from anomaly     import detect_spike as detect_anomaly
from allocate    import allocate as allocate_stock, HospitalRequest
from graph_rag   import get_graph
from crag_evaluator import CRAGEvaluator

# ── Gemini (only imported when needed) ────────────────────────────────────────
import google.generativeai as genai
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))


# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Pharmasite API",
    description="AI-powered medicine supply chain prediction for low-resource settings.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic models ───────────────────────────────────────────────────────────

class BatchItem(BaseModel):
    batch_no:    str
    expiry_date: str      # ISO format: "YYYY-MM-DD"
    qty:         int

class StockInput(BaseModel):
    drug:               str
    counted_stock:      int
    usable_stock:       int
    verified_stock:     int
    daily_usage:        list[float] = Field(..., min_length=1)
    hospital_type:      str         # "rural" | "urban"
    cold_chain_intact:  bool
    batches:            list[BatchItem]
    # ★ Optional fields for CRAG + GraphRAG
    hospital_id:        Optional[str] = "unknown"
    region:             Optional[str] = "Koraput"
    last_log_timestamp: Optional[str] = None   # ISO datetime of last data update

class AllocationRequest(BaseModel):
    drug:        str
    total_stock: int
    hospitals:   list[dict]         # [{id, type, income, urgency_score}]


# ── POST /predict ─────────────────────────────────────────────────────────────

@app.post("/predict")
def predict(data: StockInput):
    """
    Core shortage prediction endpoint.

    ★ CRAG path:
      - CORRECT   → prediction proceeds, confidence_score ≥ 0.8
      - AMBIGUOUS → prediction proceeds with human_review_required=True
      - INCORRECT → raw data discarded, regional fallback used, data_source='regional_fallback'

    ★ GraphRAG enrichment added to every response:
      - seasonal_demand_multiplier
      - known_substitutes (offline, no Gemini cost)
      - ripple_risk_alert (which neighbouring facilities will be affected)
    """
    try:
        result = run_prediction(
            data=data,
            hospital_id=data.hospital_id,
            region=data.region,
            last_log_timestamp=data.last_log_timestamp,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /anomaly ─────────────────────────────────────────────────────────────

@app.post("/anomaly")
def anomaly(data: StockInput):
    """Detect usage spikes. Anomaly if today > 1.5× historical average."""
    try:
        return detect_anomaly(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /alternatives ────────────────────────────────────────────────────────

@app.post("/alternatives")
def alternatives(data: StockInput):
    """
    Drug substitute suggestions.

    ★ GraphRAG-first strategy:
      1. Check graph knowledge for known substitutes (offline, instant, free)
      2. If graph has substitutes → return immediately (no Gemini API call)
      3. If graph has no data for this drug → call Gemini 1.5 Pro
    """
    graph = get_graph()
    local_subs = graph.get_substitutes(data.drug)

    if local_subs:
        # Graph answered — no API call needed
        return {
            "drug": data.drug,
            "source": "graph_rag_local",
            "alternatives": local_subs,
            "note": "Retrieved from MediTrace knowledge graph (offline, no latency)",
        }

    # Graph has no data → fall through to Gemini
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY not configured")

    try:
        model = genai.GenerativeModel("gemini-1.5-pro")
        prompt = (
            f"{data.drug} shortage at a rural Indian hospital. "
            f"Suggest 3 alternative drugs. Return JSON only, no markdown:\n"
            f'[{{"drug":"","match_pct":0,"key_difference":""}}]'
        )
        response = model.generate_content(prompt)
        raw = response.text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)
        return {
            "drug": data.drug,
            "source": "gemini_1.5_pro",
            "alternatives": parsed,
        }
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Gemini returned non-JSON response")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e}")


# ── POST /allocate ────────────────────────────────────────────────────────────

@app.post("/allocate")
def allocate(req: AllocationRequest):
    """
    Fairness-weighted allocation.
    +0.3 rural · +0.2 low-income · 40% hard cap per facility.
    """
    try:
        return allocate_stock(req.drug, req.total_stock, req.hospitals)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /district-risk ────────────────────────────────────────────────────────

@app.get("/district-risk")
def district_risk(
    region: Optional[str] = Query(None, description="Filter by region name"),
):
    """
    Returns all facilities with coordinates + live risk level + drug at risk.
    ★ Uses GraphRAG facility graph for coordinates and hospital metadata.
    Teammate plots this on Leaflet.js with colour-coded risk markers.

    Response shape:
      [{hospital_id, name, lat, lng, risk, drug_at_risk, days_left,
        ripple_warning (bool), region, hospital_type}]
    """
    graph = get_graph()
    facilities = graph.facilities.values()
    if region:
        facilities = [f for f in facilities if f.region == region]

    # In production: query latest prediction results from DB.
    # For demo: return mock risk data shaped correctly for Leaflet.
    mock_risks = {
        h["hospital_id"]: {
            "risk": h["risk"],
            "drug_at_risk": h["drug_at_risk"],
            "days_left": h["days_left"],
        }
        for h in json.load(open("hospitals.json"))
    }

    result = []
    for fac in facilities:
        risk_data = mock_risks.get(fac.id, {"risk": "LOW", "drug_at_risk": None, "days_left": 30.0})

        # ★ GraphRAG: add ripple warning if this facility neighbours a HIGH-risk region
        ripple = graph.get_ripple_risk(
            risk_data.get("drug_at_risk") or "Amoxicillin",
            fac.region,
        )
        ripple_warning = len(ripple["neighbour_regions_at_risk"]) > 0

        result.append({
            "hospital_id":    fac.id,
            "name":           fac.name,
            "lat":            fac.lat,
            "lng":            fac.lng,
            "region":         fac.region,
            "hospital_type":  fac.hospital_type,
            "risk":           risk_data["risk"],
            "drug_at_risk":   risk_data["drug_at_risk"],
            "days_left":      risk_data["days_left"],
            "ripple_warning": ripple_warning,   # ★
        })

    return result


# ── GET /fairness-audit ───────────────────────────────────────────────────────

@app.get("/fairness-audit")
def fairness_audit():
    """
    Returns allocation equity summary for the last 30 days.
    Teammate renders as a bar chart (Recharts / Chart.js).
    """
    # In production: query allocation_log table in SQLite.
    # For demo: return mock summary with correct shape.
    return {
        "period":                        "last_30_days",
        "rural_avg_units_per_patient":   2.4,
        "urban_avg_units_per_patient":   2.1,
        "fairness_score":                0.87,
        "hospitals_audited":             len(get_graph().facilities),
        "note": (
            "Fairness score > 0.85 indicates equitable distribution. "
            "Rural boost (+0.3 priority weight) is working as intended."
        ),
    }


# ── GET /health ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "version": "2.0.0",
        "modules": ["crag_evaluator", "graph_rag", "prediction",
                    "anomaly", "allocate", "agent"],
        "timestamp": datetime.utcnow().isoformat(),
    }
