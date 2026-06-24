"""
allocate.py — MediTrace Fairness Layer
Stage 5: Priority-weighted stock allocation with rural/low-income boost.
Stage 8: /fairness-audit data provider (30-day SQLite history).
"""

import sqlite3
import json
import os
from datetime import datetime, timedelta
from typing import Literal


# ─── Database Setup ────────────────────────────────────────────────────────────

DB_PATH = os.getenv("MEDITRACE_DB", "meditrace.db")


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create the allocation_log table if it doesn't exist."""
    with _get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS allocation_log (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                allocated_at    TEXT    NOT NULL,
                drug            TEXT    NOT NULL,
                hospital_id     TEXT    NOT NULL,
                hospital_name   TEXT    NOT NULL,
                hospital_type   TEXT    NOT NULL,
                income_level    TEXT    NOT NULL,
                patient_count   INTEGER NOT NULL,
                units_allocated INTEGER NOT NULL,
                priority_score  REAL    NOT NULL
            )
        """)
        conn.commit()


# ─── Data Models (plain dataclasses — no extra libraries) ──────────────────────

class HospitalRequest:
    """
    Represents a single hospital's allocation request.

    Fields
    ------
    hospital_id     : unique identifier (e.g. "KRC-001")
    hospital_name   : human-readable name
    hospital_type   : "rural" | "urban"
    income_level    : "low" | "medium" | "high"
    patient_count   : number of patients who need this drug
    urgency_score   : base clinical urgency 0.0–1.0 (from prediction risk)
    """

    def __init__(
        self,
        hospital_id: str,
        hospital_name: str,
        hospital_type: Literal["rural", "urban"],
        income_level: Literal["low", "medium", "high"],
        patient_count: int,
        urgency_score: float = 1.0,
    ):
        if not 0.0 <= urgency_score <= 1.0:
            raise ValueError(f"urgency_score must be 0–1, got {urgency_score}")
        if patient_count < 0:
            raise ValueError("patient_count cannot be negative")

        self.hospital_id   = hospital_id
        self.hospital_name = hospital_name
        self.hospital_type = hospital_type
        self.income_level  = income_level
        self.patient_count = patient_count
        self.urgency_score = urgency_score


# ─── Custom Exception ──────────────────────────────────────────────────────────

class AllocationError(Exception):
    """Raised when allocation inputs are invalid or no stock is available."""


# ─── Core Allocation Logic ─────────────────────────────────────────────────────

RURAL_BOOST      = 0.3   # equity bonus for rural facilities
LOW_INCOME_BOOST = 0.2   # equity bonus for low-income catchment areas
HARD_CAP_RATIO   = 0.40  # no single facility may receive more than 40% of stock


def _compute_priority(hospital: HospitalRequest) -> float:
    """
    Priority = urgency_score (clinical)
             + 0.3 if rural
             + 0.2 if low-income

    Minimum floor of 0.1 so even low-urgency hospitals get some allocation.
    """
    score = hospital.urgency_score
    if hospital.hospital_type == "rural":
        score += RURAL_BOOST
    if hospital.income_level == "low":
        score += LOW_INCOME_BOOST
    return max(score, 0.1)


def allocate(
    hospitals: list[HospitalRequest],
    total_stock: int,
    drug: str,
    log_to_db: bool = True,
) -> list[dict]:
    """
    Distribute `total_stock` units across hospitals using priority weights.

    Rules
    -----
    1. Compute weighted priority per hospital.
    2. Allocate proportionally: units = (priority / total_priority) × total_stock
    3. Hard cap: no hospital receives more than 40% of total_stock.
    4. If cap is applied, leftover units are redistributed to remaining hospitals
       (single redistribution pass — simple and fast for hackathon scale).
    5. Log each allocation to SQLite for the fairness audit trail.

    Returns
    -------
    List of allocation dicts sorted by units_allocated descending.
    """
    if not hospitals:
        raise AllocationError("Hospital list is empty — nothing to allocate.")
    if total_stock <= 0:
        raise AllocationError(f"total_stock must be positive, got {total_stock}.")

    hard_cap_units = int(HARD_CAP_RATIO * total_stock)

    # ── Step 1: compute priority scores ────────────────────────────────────────
    results = []
    for h in hospitals:
        results.append({
            "hospital_id":   h.hospital_id,
            "hospital_name": h.hospital_name,
            "hospital_type": h.hospital_type,
            "income_level":  h.income_level,
            "patient_count": h.patient_count,
            "priority":      _compute_priority(h),
            "units":         0,
            "capped":        False,
        })

    # ── Step 2: proportional allocation ────────────────────────────────────────
    total_priority = sum(r["priority"] for r in results)

    for r in results:
        share = r["priority"] / total_priority
        r["units"] = round(share * total_stock)

    # ── Step 3: apply hard cap and collect surplus ──────────────────────────────
    surplus = 0
    for r in results:
        if r["units"] > hard_cap_units:
            surplus     += r["units"] - hard_cap_units
            r["units"]   = hard_cap_units
            r["capped"]  = True

    # ── Step 4: redistribute surplus to uncapped hospitals ─────────────────────
    if surplus > 0:
        uncapped = [r for r in results if not r["capped"]]
        if uncapped:
            uncapped_priority = sum(r["priority"] for r in uncapped)
            for r in uncapped:
                extra    = round((r["priority"] / uncapped_priority) * surplus)
                new_total = r["units"] + extra
                # respect cap even after redistribution
                if new_total > hard_cap_units:
                    extra    = hard_cap_units - r["units"]
                r["units"] += extra

    # Rounding may leave a ±1 discrepancy vs total_stock — acceptable for demo.

    # ── Step 5: compute units-per-patient for fairness metric ──────────────────
    for r in results:
        pc = r["patient_count"]
        r["units_per_patient"] = round(r["units"] / pc, 2) if pc > 0 else None

    # ── Step 6: log to SQLite ──────────────────────────────────────────────────
    if log_to_db:
        _log_allocations(results, drug)

    # ── Step 7: clean up internal fields and return ────────────────────────────
    output = []
    for r in results:
        output.append({
            "hospital_id":      r["hospital_id"],
            "hospital_name":    r["hospital_name"],
            "hospital_type":    r["hospital_type"],
            "income_level":     r["income_level"],
            "patient_count":    r["patient_count"],
            "priority_score":   round(r["priority"], 3),
            "units_allocated":  r["units"],
            "units_per_patient": r["units_per_patient"],
            "cap_applied":      r["capped"],
        })

    output.sort(key=lambda x: x["units_allocated"], reverse=True)
    return output


# ─── SQLite Logging ────────────────────────────────────────────────────────────

def _log_allocations(results: list[dict], drug: str) -> None:
    """Persist allocation results to the audit log table."""
    init_db()
    now = datetime.utcnow().isoformat()
    rows = [
        (
            now,
            drug,
            r["hospital_id"],
            r["hospital_name"],
            r["hospital_type"],
            r["income_level"],
            r["patient_count"],
            r["units"],
            r["priority"],
        )
        for r in results
    ]
    with _get_conn() as conn:
        conn.executemany(
            """INSERT INTO allocation_log
               (allocated_at, drug, hospital_id, hospital_name,
                hospital_type, income_level, patient_count,
                units_allocated, priority_score)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            rows,
        )
        conn.commit()


# ─── Fairness Audit (Stage 8 Wow) ─────────────────────────────────────────────

def fairness_audit(lookback_days: int = 30) -> dict:
    """
    Aggregate the last `lookback_days` of allocation logs.

    Returns
    -------
    {
        "period":                    "last_30_days",
        "rural_avg_units_per_patient": float,
        "urban_avg_units_per_patient": float,
        "fairness_score":             float,   # rural/urban ratio, capped at 1.0
        "hospitals_audited":          int,
        "breakdown_by_income":        { "low": float, "medium": float, "high": float },
        "generated_at":               ISO timestamp,
    }
    """
    init_db()
    cutoff = (datetime.utcnow() - timedelta(days=lookback_days)).isoformat()

    with _get_conn() as conn:
        rows = conn.execute(
            """SELECT hospital_type, income_level,
                      SUM(units_allocated) AS total_units,
                      SUM(patient_count)   AS total_patients,
                      COUNT(DISTINCT hospital_id) AS hospital_count
               FROM allocation_log
               WHERE allocated_at >= ?
               GROUP BY hospital_type, income_level""",
            (cutoff,),
        ).fetchall()

    # Aggregate by hospital_type
    type_agg: dict[str, dict] = {}
    income_agg: dict[str, dict] = {}

    for row in rows:
        h_type   = row["hospital_type"]
        h_income = row["income_level"]
        units    = row["total_units"] or 0
        patients = row["total_patients"] or 0
        h_count  = row["hospital_count"] or 0

        # by type
        if h_type not in type_agg:
            type_agg[h_type] = {"units": 0, "patients": 0, "hospitals": set()}
        type_agg[h_type]["units"]    += units
        type_agg[h_type]["patients"] += patients
        type_agg[h_type]["hospitals"].add(h_type + h_income)  # proxy for distinct

        # by income
        if h_income not in income_agg:
            income_agg[h_income] = {"units": 0, "patients": 0}
        income_agg[h_income]["units"]    += units
        income_agg[h_income]["patients"] += patients

    def avg_upp(agg_entry: dict) -> float | None:
        p = agg_entry["patients"]
        return round(agg_entry["units"] / p, 2) if p > 0 else None

    rural_avg = avg_upp(type_agg["rural"]) if "rural" in type_agg else 0.0
    urban_avg = avg_upp(type_agg["urban"]) if "urban" in type_agg else 0.0

    # Fairness score: rural / urban ratio (ideal = 1.0 means equal)
    if urban_avg and urban_avg > 0:
        fairness_score = round(min(rural_avg / urban_avg, 1.0), 3)
    elif rural_avg and rural_avg > 0:
        fairness_score = 1.0  # only rural — perfectly fair by definition
    else:
        fairness_score = None

    breakdown_by_income = {
        level: avg_upp(income_agg[level]) if level in income_agg else 0.0
        for level in ("low", "medium", "high")
    }

    total_hospitals = sum(
        conn.execute(
            "SELECT COUNT(DISTINCT hospital_id) FROM allocation_log WHERE allocated_at >= ?",
            (cutoff,),
        ).fetchone()[0]
        for conn in [_get_conn()]
    )

    return {
        "period":                        f"last_{lookback_days}_days",
        "rural_avg_units_per_patient":   rural_avg,
        "urban_avg_units_per_patient":   urban_avg,
        "fairness_score":                fairness_score,
        "hospitals_audited":             total_hospitals,
        "breakdown_by_income":           breakdown_by_income,
        "generated_at":                  datetime.utcnow().isoformat(),
    }


# ─── Quick smoke-test (run: python allocate.py) ───────────────────────────────

if __name__ == "__main__":
    sample_hospitals = [
        HospitalRequest("KRC-001", "Koraput Rural Clinic",    "rural", "low",    120, urgency_score=0.9),
        HospitalRequest("BHU-002", "Bhubaneswar City Hospital","urban", "medium", 400, urgency_score=0.8),
        HospitalRequest("MKG-003", "Malkangiri PHC",           "rural", "low",     60, urgency_score=0.6),
        HospitalRequest("CTK-004", "Cuttack District Hospital", "urban", "high",  300, urgency_score=0.7),
    ]

    total_stock = 1000
    drug        = "Amoxicillin"

    print(f"\n── Allocating {total_stock} units of {drug} ──")
    result = allocate(sample_hospitals, total_stock, drug, log_to_db=True)

    for r in result:
        cap_flag = " [CAP APPLIED]" if r["cap_applied"] else ""
        print(
            f"  {r['hospital_name']:<30} "
            f"type={r['hospital_type']:<6} "
            f"income={r['income_level']:<7} "
            f"priority={r['priority_score']:.3f}  "
            f"units={r['units_allocated']:>4}  "
            f"u/patient={r['units_per_patient']}{cap_flag}"
        )

    print(f"\n── Fairness Audit (last 30 days) ──")
    audit = fairness_audit(30)
    print(json.dumps(audit, indent=2))