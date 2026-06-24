"""
agent.py — Procurement agent for PharmaSight.

Changes from original spec:
  ★ Accepts optional override_supplier from GraphRAG (best supplier by
    reliability score for the drug + region), falling back to mock DB.
  ★ suggest_order() returns GraphRAG supplier metadata when available.

Original spec behaviour is fully preserved:
  - Mock SUPPLIERS dict as fallback
  - 30-day buffer quantity
  - 48-hour escalation log in SQLite
"""

from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta
from typing import Optional


# ── Mock supplier DB (fallback when GraphRAG has no data) ─────────────────────
SUPPLIERS = {
    "Amoxicillin":            {"name": "MedSupply India",    "lead_days": 3,  "cost_per_unit": 12},
    "Insulin":                {"name": "ColdMed Logistics",  "lead_days": 4,  "cost_per_unit": 45},
    "Oxytocin":               {"name": "ColdMed Logistics",  "lead_days": 4,  "cost_per_unit": 55},
    "Paracetamol":            {"name": "OdishaStatePharma",  "lead_days": 2,  "cost_per_unit": 4},
    "Artemether-Lumefantrine":{"name": "PharmaBridge",       "lead_days": 5,  "cost_per_unit": 90},
    "ORS":                    {"name": "OdishaStatePharma",  "lead_days": 2,  "cost_per_unit": 8},
    "default":                {"name": "PharmaBridge",       "lead_days": 5,  "cost_per_unit": 20},
}

INR_PER_USD = 83


def suggest_order(
    drug: str,
    daily_avg: float,
    override_supplier: Optional[dict] = None,   # ★ from GraphRAG
    db_path: str = "meditrace.db",
) -> dict:
    """
    Build a draft procurement suggestion (never auto-sent — for admin review).

    Args:
        drug              : drug name
        daily_avg         : adjusted daily usage (may include seasonal multiplier)
        override_supplier : GraphRAG best supplier dict with keys
                            {name, lead_days, cost_per_unit_inr, reliability_score}
    """
    if override_supplier:
        # ★ GraphRAG path — highest reliability supplier for this drug + region
        supplier_name = override_supplier["name"]
        lead_days     = override_supplier["lead_days"]
        cost_per_unit = override_supplier["cost_per_unit_inr"]
        reliability   = override_supplier.get("reliability_score", 1.0)
        source        = "graph_rag"
    else:
        # Fallback to mock DB
        s             = SUPPLIERS.get(drug, SUPPLIERS["default"])
        supplier_name = s["name"]
        lead_days     = s["lead_days"]
        cost_per_unit = s["cost_per_unit"]
        reliability   = None
        source        = "mock_db"

    qty      = int(daily_avg * 30)                  # 30-day buffer
    cost_inr = qty * cost_per_unit

    suggestion = {
        "supplier":          supplier_name,
        "quantity":          qty,
        "lead_days":         lead_days,
        "cost_inr":          cost_inr,
        "supplier_source":   source,   # ★ so admin knows where suggestion came from
    }
    if reliability is not None:
        suggestion["supplier_reliability_score"] = reliability

    # Log and trigger 48h escalation timer
    _log_alert(drug=drug, db_path=db_path)

    return suggestion


# ── 48-hour escalation logic ──────────────────────────────────────────────────

def _log_alert(drug: str, hospital_id: str = "unknown", db_path: str = "meditrace.db"):
    with sqlite3.connect(db_path) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS alert_log (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                hospital_id     TEXT,
                drug            TEXT NOT NULL,
                alerted_at      TEXT NOT NULL,
                acknowledged_at TEXT,
                escalated       INTEGER DEFAULT 0
            )
        """)
        conn.execute(
            "INSERT INTO alert_log (hospital_id, drug, alerted_at) VALUES (?,?,?)",
            (hospital_id, drug, datetime.utcnow().isoformat()),
        )


def check_and_escalate(db_path: str = "meditrace.db") -> list[dict]:
    """
    Run this on a background thread / cron every hour.
    Returns list of alerts that were just escalated.
    """
    cutoff = (datetime.utcnow() - timedelta(hours=48)).isoformat()
    escalated = []

    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        pending = conn.execute(
            """SELECT id, hospital_id, drug, alerted_at
               FROM alert_log
               WHERE alerted_at < ?
                 AND acknowledged_at IS NULL
                 AND escalated = 0""",
            (cutoff,),
        ).fetchall()

        for row in pending:
            conn.execute(
                "UPDATE alert_log SET escalated = 1 WHERE id = ?",
                (row["id"],),
            )
            escalated.append({
                "hospital_id": row["hospital_id"],
                "drug":        row["drug"],
                "alerted_at":  row["alerted_at"],
                "action":      "Escalated to CMO/Admin — no pharmacist acknowledgement in 48h",
            })

    return escalated
