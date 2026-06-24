"""
district_map.py  ·  MediTrace Stage 8 — Wow Factor
────────────────────────────────────────────────────
Provides the GET /district-risk endpoint payload.

For each hospital in hospitals.json this module:
  1. Runs the same conservative stock logic as prediction.py
     (effective_stock = min of 3 counts)
  2. Applies expiry deductions for batches expiring within 60 days
  3. Flags cold-chain compromise for temperature-sensitive drugs
  4. Computes days_left and maps it to HIGH / MEDIUM / LOW risk
  5. Returns a list of map-ready dicts your teammate feeds to Leaflet.js

No new libraries required — stdlib only (json, datetime, statistics, os, pathlib).
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from statistics import mean
from typing import Optional


# ── Temperature-sensitive drug set (mirrors prediction.py) ──────────────────
COLD_CHAIN_DRUGS: set[str] = {"insulin", "oxytocin", "vaccines", "erythropoietin"}

# ── Drug unit prices in INR (mirrors prediction.py wastage calc) ─────────────
DRUG_PRICES_INR: dict[str, float] = {
    "Amoxicillin": 15.0,
    "Insulin":     180.0,
    "Oxytocin":    120.0,
    "Paracetamol": 5.0,
    "Metformin":   8.0,
    "default":     25.0,
}

# ── Path to mock hospital dataset ────────────────────────────────────────────
_HERE = Path(__file__).parent
HOSPITALS_JSON = _HERE / "hospitals.json"


# ── Custom exceptions ─────────────────────────────────────────────────────────
class HospitalsFileNotFoundError(FileNotFoundError):
    """hospitals.json is missing from the expected location."""


class PhantomStockWarning(ValueError):
    """counted_stock vs verified_stock discrepancy > 15%."""


# ── Core risk computation ─────────────────────────────────────────────────────
def _compute_risk(hospital: dict) -> dict:
    """
    Run prediction logic on a single hospital record.

    Returns a dict with keys:
        hospital_id, name, district, lat, lng, type, income,
        patient_load, drug, days_left, risk, drug_at_risk,
        wastage_value_inr, warnings, phantom_stock_flag
    """
    drug          = hospital["drug"]
    counted       = hospital["counted_stock"]
    usable        = hospital["usable_stock"]
    verified      = hospital["verified_stock"]
    daily_usage   = hospital["daily_usage"]
    cold_ok       = hospital["cold_chain_intact"]
    batches       = hospital.get("batches", [])

    warnings: list[str] = []

    # ── 1. Phantom stock check ────────────────────────────────────────────────
    phantom_flag = False
    gap_pct = abs(counted - verified) / max(counted, 1) * 100
    if gap_pct > 15:
        phantom_flag = True
        warnings.append(
            f"Data reliability warning: {round(gap_pct)}% gap between "
            f"counted ({counted}) and verified ({verified}) stock. "
            "Physical audit recommended."
        )

    # ── 2. Expiry deduction (60-day window) ───────────────────────────────────
    threshold = datetime.today() + timedelta(days=60)
    expiring_soon: list[dict] = []
    expiry_qty = 0
    for b in batches:
        try:
            exp = datetime.strptime(b["expiry_date"], "%Y-%m-%d")
        except (ValueError, KeyError):
            continue
        if exp < threshold:
            expiring_soon.append(b)
            expiry_qty += b.get("qty", 0)

    if expiring_soon:
        warnings.append(
            f"{len(expiring_soon)} batch(es) expiring within 60 days "
            f"({expiry_qty} units). Usable stock adjusted."
        )
        usable = max(0, usable - expiry_qty)

    # ── 3. Cold chain flag ────────────────────────────────────────────────────
    cold_chain_compromised = False
    if not cold_ok and drug.lower() in COLD_CHAIN_DRUGS:
        cold_chain_compromised = True
        warnings.append(
            f"Cold chain broken — all {drug} batches may be compromised."
        )
        usable = 0          # treat entire usable stock as compromised

    # ── 4. Conservative effective stock ──────────────────────────────────────
    effective_stock = min(counted, usable, verified)

    # ── 5. Moving average → days left → risk ─────────────────────────────────
    avg_daily = mean(daily_usage) if daily_usage else 1.0
    days_left = round(effective_stock / avg_daily, 1) if avg_daily > 0 else 999.0

    if days_left <= 7:
        risk = "HIGH"
    elif days_left <= 14:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    # ── 6. Wastage value (expiring batches) ───────────────────────────────────
    price = DRUG_PRICES_INR.get(drug, DRUG_PRICES_INR["default"])
    wastage_value_inr = round(expiry_qty * price, 2)

    return {
        "hospital_id":        hospital["hospital_id"],
        "name":               hospital["name"],
        "district":           hospital["district"],
        "lat":                hospital["lat"],
        "lng":                hospital["lng"],
        "type":               hospital["type"],
        "income":             hospital.get("income", "unknown"),
        "patient_load":       hospital.get("patient_load", 0),
        "drug":               drug,
        "drug_at_risk":       drug,            # alias used by map frontend
        "days_left":          days_left,
        "risk":               risk,
        "effective_stock":    effective_stock,
        "avg_daily_usage":    round(avg_daily, 2),
        "cold_chain_ok":      cold_ok,
        "cold_chain_compromised": cold_chain_compromised,
        "wastage_value_inr":  wastage_value_inr,
        "expiring_soon_count": len(expiring_soon),
        "phantom_stock_flag": phantom_flag,
        "warnings":           warnings,
    }


# ── Public interface ──────────────────────────────────────────────────────────
def get_district_risk(
    risk_filter: Optional[str] = None,
    district: Optional[str] = None,
) -> list[dict]:
    """
    Load all hospitals from hospitals.json, compute risk for each,
    and return the map-ready payload.

    Parameters
    ----------
    risk_filter : "HIGH" | "MEDIUM" | "LOW" | None
        If provided, return only hospitals at that risk level.
    district : str | None
        If provided, filter by district name (case-insensitive).

    Returns
    -------
    List of risk dicts, sorted HIGH → MEDIUM → LOW for map layer ordering.
    """
    if not HOSPITALS_JSON.exists():
        raise HospitalsFileNotFoundError(
            f"hospitals.json not found at {HOSPITALS_JSON}. "
            "Place the file in the same directory as district_map.py."
        )

    with open(HOSPITALS_JSON, "r", encoding="utf-8") as f:
        hospitals = json.load(f)

    results = [_compute_risk(h) for h in hospitals]

    # ── Optional filters ──────────────────────────────────────────────────────
    if risk_filter:
        results = [r for r in results if r["risk"] == risk_filter.upper()]
    if district:
        results = [r for r in results if r["district"].lower() == district.lower()]

    # ── Sort: HIGH first so map layers render correctly ───────────────────────
    order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    results.sort(key=lambda r: order.get(r["risk"], 3))

    return results


def get_district_summary() -> dict:
    """
    Return aggregate stats for the map legend / dashboard header.
    """
    all_hospitals = get_district_risk()
    total = len(all_hospitals)
    high  = sum(1 for h in all_hospitals if h["risk"] == "HIGH")
    med   = sum(1 for h in all_hospitals if h["risk"] == "MEDIUM")
    low   = sum(1 for h in all_hospitals if h["risk"] == "LOW")
    total_wastage = sum(h["wastage_value_inr"] for h in all_hospitals)
    phantom_count = sum(1 for h in all_hospitals if h["phantom_stock_flag"])
    cold_compromised = sum(1 for h in all_hospitals if h["cold_chain_compromised"])

    return {
        "total_hospitals": total,
        "high_risk_count": high,
        "medium_risk_count": med,
        "low_risk_count": low,
        "total_wastage_inr": round(total_wastage, 2),
        "phantom_stock_alerts": phantom_count,
        "cold_chain_failures": cold_compromised,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }


# ── Smoke test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=== District Risk Summary ===")
    summary = get_district_summary()
    for k, v in summary.items():
        print(f"  {k}: {v}")

    print("\n=== HIGH risk hospitals ===")
    high_risk = get_district_risk(risk_filter="HIGH")
    for h in high_risk:
        print(
            f"  [{h['hospital_id']}] {h['name']} | {h['drug']} | "
            f"{h['days_left']} days left | ₹{h['wastage_value_inr']} wastage"
        )
        if h["warnings"]:
            for w in h["warnings"]:
                print(f"    ⚠  {w}")

    print("\n=== All hospitals (map payload sample) ===")
    all_h = get_district_risk()
    for h in all_h:
        print(
            f"  {h['risk']:6}  {h['name']:<40}  lat={h['lat']}  lng={h['lng']}"
        )
