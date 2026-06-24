"""
prediction.py — Risk assessment engine for MediTrace.

Integration points for CRAG + GraphRAG (new additions marked ★):

  ★ GraphRAG  : enriches every prediction with seasonal demand, ripple risk,
                and known substitute drugs — before any API call is made.
  ★ CRAG      : evaluates input data quality (correct / ambiguous / incorrect)
                and replaces bad data with regional fallback automatically.

Flow:
  1. StockInput arrives
  2. GraphRAG.enrich_prediction_context() → seasonal multiplier, supplier, substitutes
  3. CRAGEvaluator.evaluate()             → data quality verdict
     → CORRECT   : use raw input as-is
     → AMBIGUOUS : use raw input but add human_review flag to response
     → INCORRECT : replace effective_stock + daily_avg with regional fallback
  4. Core prediction math (unchanged from original MediTrace spec)
  5. Cold chain, expiry, phantom-stock checks
  6. Auto-trigger agent.py on HIGH risk
  7. Return enriched PredictionResult
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta
from statistics import mean
from typing import Optional

from crag_evaluator import CRAGEvaluator, Verdict
from graph_rag import get_graph

# ── Cold-chain drug registry (unchanged from original spec) ──────────────────
COLD_CHAIN_DRUGS = {"insulin", "oxytocin", "vaccines", "erythropoietin"}

# ── Drug unit prices for wastage calculator ──────────────────────────────────
DRUG_PRICES_INR = {
    "Amoxicillin": 15,
    "Insulin": 180,
    "Oxytocin": 55,
    "Paracetamol": 4,
    "Artemether-Lumefantrine": 90,
    "ORS": 8,
    "default": 25,
}


def run_prediction(
    data,                              # StockInput pydantic model
    hospital_id: str = "unknown",
    region: str = "Koraput",
    last_log_timestamp: Optional[str] = None,
) -> dict:
    """
    Main prediction function. Returns a complete response dict ready to
    serialise as the /predict endpoint response.
    """

    # ── ★ Step 1: GraphRAG context enrichment ─────────────────────────────────
    graph = get_graph()
    current_month = datetime.utcnow().month
    graph_context = graph.enrich_prediction_context(data.drug, region, current_month)

    seasonal_multiplier = graph_context["seasonal_demand_multiplier"]
    known_substitutes   = graph_context["known_substitutes"]
    ripple_risk         = graph_context["ripple_risk"]
    best_supplier       = graph_context["best_supplier"]

    # ── ★ Step 2: CRAG data quality evaluation ────────────────────────────────
    evaluator = CRAGEvaluator()
    crag_result = evaluator.evaluate(
        data=data,
        hospital_id=hospital_id,
        region=region,
        last_log_timestamp=last_log_timestamp,
    )

    # ── Step 3: Resolve working values (original or CRAG-corrected) ──────────
    if crag_result.verdict == Verdict.INCORRECT and crag_result.fallback_used:
        # Bad data detected — use regional baseline instead
        effective_stock = crag_result.corrected_effective_stock
        daily_avg       = crag_result.corrected_daily_avg
        data_source     = "regional_fallback"
    else:
        # Data is CORRECT or AMBIGUOUS → use as-is
        effective_stock = min(
            data.counted_stock,
            data.usable_stock,
            data.verified_stock,
        )
        daily_avg   = mean(data.daily_usage) if data.daily_usage else 1.0
        data_source = "pharmacist_log"

    # ── ★ Step 4: Apply seasonal demand multiplier from GraphRAG ─────────────
    # Seasonal spikes inflate effective daily need — shrink days_left accordingly
    adjusted_avg = daily_avg * seasonal_multiplier

    # ── Step 5: Core risk calculation (original MediTrace spec) ──────────────
    days_left = round(effective_stock / adjusted_avg, 1) if adjusted_avg > 0 else 999
    risk      = (
        "HIGH"   if days_left <= 7  else
        "MEDIUM" if days_left <= 14 else
        "LOW"
    )

    # ── Step 6: Expiry batch tracking ─────────────────────────────────────────
    warnings: list[str] = []
    expiring_soon: list[dict] = []
    threshold_60 = datetime.today() + timedelta(days=60)
    threshold_30 = datetime.today() + timedelta(days=30)

    for b in data.batches:
        try:
            exp = datetime.strptime(b.expiry_date, "%Y-%m-%d")
        except (ValueError, AttributeError):
            continue
        if exp < threshold_60:
            expiring_soon.append({
                "batch_no": b.batch_no,
                "expiry_date": b.expiry_date,
                "qty": b.qty,
            })

    # Wastage cost (30-day horizon)
    price = DRUG_PRICES_INR.get(data.drug, DRUG_PRICES_INR["default"])
    expiring_30 = [
        b for b in data.batches
        if _parse_date(b.expiry_date) and
           _parse_date(b.expiry_date) < threshold_30
    ]
    wastage_value_inr = sum(b.qty for b in expiring_30) * price

    # ── Step 7: Cold chain check ───────────────────────────────────────────────
    cold_chain_compromised = False
    if (not data.cold_chain_intact
            and data.drug.lower() in COLD_CHAIN_DRUGS):
        cold_chain_compromised = True
        warnings.append(
            f"Cold chain broken — all {data.drug} batches at this facility "
            f"may be compromised. Dispose and reorder immediately."
        )

    # ── Step 8: Phantom stock discrepancy flag ────────────────────────────────
    gap = abs(data.counted_stock - data.verified_stock)
    gap_pct = gap / max(data.counted_stock, 1) * 100
    if gap_pct > 15:
        warnings.append(
            f"Data reliability warning: {round(gap_pct)}% gap between "
            f"counted and verified stock. Physical audit recommended."
        )

    # ── Step 9: Auto-trigger procurement agent on HIGH risk ───────────────────
    procurement_suggestion = None
    if risk == "HIGH":
        from agent import suggest_order
        procurement_suggestion = suggest_order(
            drug=data.drug,
            daily_avg=adjusted_avg,
            override_supplier=best_supplier,  # ★ GraphRAG best supplier
        )

    # ── Step 10: ★ Ripple risk alert ─────────────────────────────────────────
    ripple_alert = None
    if risk in ("HIGH", "MEDIUM") and ripple_risk["ripple_facilities"]:
        ripple_alert = {
            "message": (
                f"Shortage of {data.drug} in {region} may cause substitution "
                f"pressure in {len(ripple_risk['ripple_facilities'])} "
                f"neighbouring facilities."
            ),
            "affected_facilities": ripple_risk["ripple_facilities"],
            "neighbour_regions": ripple_risk["neighbour_regions_at_risk"],
        }

    # ── Assemble response ─────────────────────────────────────────────────────
    return {
        # ── Core prediction
        "drug": data.drug,
        "hospital_type": data.hospital_type,
        "effective_stock": effective_stock,
        "daily_average_usage": round(adjusted_avg, 2),
        "days_left": days_left,
        "risk_level": risk,

        # ── CRAG quality metadata  ★
        "data_quality": crag_result.to_dict(),
        "data_source": data_source,
        "human_review_required": crag_result.human_review_required,

        # ── Expiry & wastage
        "expiring_soon": expiring_soon,
        "wastage_value_inr": wastage_value_inr,

        # ── Cold chain
        "cold_chain_compromised": cold_chain_compromised,

        # ── Warnings (phantom stock, cold chain, stale data)
        "warnings": warnings,

        # ── Procurement (only on HIGH risk)
        "procurement_suggestion": procurement_suggestion,

        # ── GraphRAG enrichment  ★
        "seasonal_demand_multiplier": seasonal_multiplier,
        "known_substitutes": known_substitutes,
        "ripple_risk_alert": ripple_alert,
    }


# ── Utility ───────────────────────────────────────────────────────────────────

def _parse_date(s: Optional[str]) -> Optional[datetime]:
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y-%m-%d")
    except ValueError:
        return None
