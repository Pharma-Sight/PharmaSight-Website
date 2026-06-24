"""
── main.py integration snippet ─────────────────────────────────────────────────
Add these imports + routes to your existing main.py.
The endpoint supports optional query params for filtering.
────────────────────────────────────────────────────────────────────────────────
"""

# At the top of main.py, add:
from district_map import get_district_risk, get_district_summary
from typing import Optional

# ── Add these two routes to your FastAPI app ──────────────────────────────────

@app.get("/district-risk")
def district_risk(
    risk: Optional[str] = None,
    district: Optional[str] = None,
):
    """
    Returns all hospitals with their computed risk level, coordinates,
    drug at risk, days left, and wastage figures.

    Optional query params:
        ?risk=HIGH          — filter to HIGH / MEDIUM / LOW only
        ?district=Koraput   — filter by district name (case-insensitive)

    Response shape (list):
        [
          {
            "hospital_id": "KRC-001",
            "name": "Koraput District Hospital",
            "district": "Koraput",
            "lat": 18.8135,
            "lng": 82.7111,
            "type": "rural",
            "income": "low",
            "patient_load": 320,
            "drug_at_risk": "Amoxicillin",
            "days_left": 5.5,
            "risk": "HIGH",
            "wastage_value_inr": 600.0,
            "cold_chain_compromised": false,
            "phantom_stock_flag": false,
            "warnings": [...]
          },
          ...
        ]
    """
    return get_district_risk(risk_filter=risk, district=district)


@app.get("/district-summary")
def district_summary():
    """
    Returns aggregate counts for the dashboard header.

    Response shape:
        {
          "total_hospitals": 15,
          "high_risk_count": 5,
          "medium_risk_count": 2,
          "low_risk_count": 8,
          "total_wastage_inr": 45200.0,
          "phantom_stock_alerts": 0,
          "cold_chain_failures": 2,
          "generated_at": "2025-04-09T10:30:00Z"
        }
    """
    return get_district_summary()
