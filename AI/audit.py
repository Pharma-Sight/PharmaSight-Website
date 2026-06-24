"""
audit.py — MediTrace Phantom Stock Defence
Stage 7: Monthly audit prompts + discrepancy detection

Responsibilities:
  - Track last_audit_date per hospital per drug (SQLite)
  - Prompt pharmacist if audit is overdue (>30 days)
  - Raise PhantomStockException when counted vs verified gap exceeds 15%
  - Log all discrepancies for admin escalation
  - Expose get_audit_status() used by /fairness-audit endpoint
"""

import sqlite3
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ─── Config ──────────────────────────────────────────────────────────────────

DB_PATH = Path("meditrace_audit.db")
AUDIT_INTERVAL_DAYS = 30          # trigger prompt if overdue
DISCREPANCY_THRESHOLD_PCT = 15.0  # flag if gap > 15%
ESCALATION_THRESHOLD_PCT = 25.0   # escalate to admin if gap > 25%


# ─── Custom Exception ─────────────────────────────────────────────────────────

class PhantomStockException(Exception):
    """
    Raised when the gap between counted_stock and verified_stock
    exceeds DISCREPANCY_THRESHOLD_PCT (15%).

    Attributes:
        hospital_id  : str
        drug         : str
        gap_pct      : float  — percentage gap detected
        message      : str    — human-readable warning
        escalate     : bool   — True if gap also exceeds ESCALATION_THRESHOLD_PCT
    """
    def __init__(self, hospital_id: str, drug: str, gap_pct: float):
        self.hospital_id = hospital_id
        self.drug = drug
        self.gap_pct = round(gap_pct, 2)
        self.escalate = gap_pct >= ESCALATION_THRESHOLD_PCT

        if self.escalate:
            self.message = (
                f"CRITICAL: {gap_pct:.1f}% discrepancy between counted and "
                f"verified stock for '{drug}' at '{hospital_id}'. "
                "Escalating to admin — possible stock diversion or data fraud."
            )
        else:
            self.message = (
                f"Data reliability warning: {gap_pct:.1f}% gap between "
                f"counted and verified stock for '{drug}' at '{hospital_id}'. "
                "Physical audit recommended."
            )

        super().__init__(self.message)

    def to_dict(self) -> dict:
        return {
            "error": "PhantomStockDetected",
            "hospital_id": self.hospital_id,
            "drug": self.drug,
            "gap_pct": self.gap_pct,
            "escalate_to_admin": self.escalate,
            "message": self.message,
        }


# ─── DB Initialisation ────────────────────────────────────────────────────────

def _get_conn() -> sqlite3.Connection:
    """Return a connection to the audit SQLite DB, creating it if needed."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    _init_db(conn)
    return conn


def _init_db(conn: sqlite3.Connection) -> None:
    """Create tables on first run — idempotent."""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            hospital_id   TEXT    NOT NULL,
            drug          TEXT    NOT NULL,
            audited_at    TEXT    NOT NULL,   -- ISO-8601 datetime
            audited_by    TEXT    DEFAULT 'pharmacist',
            counted_stock INTEGER NOT NULL,
            verified_stock INTEGER NOT NULL,
            notes         TEXT    DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS discrepancy_log (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            hospital_id   TEXT    NOT NULL,
            drug          TEXT    NOT NULL,
            flagged_at    TEXT    NOT NULL,
            gap_pct       REAL    NOT NULL,
            counted_stock INTEGER NOT NULL,
            verified_stock INTEGER NOT NULL,
            escalated     INTEGER DEFAULT 0,  -- 0 = pharmacist notified, 1 = admin escalated
            resolved      INTEGER DEFAULT 0
        );
    """)
    conn.commit()


# ─── Core Public Functions ────────────────────────────────────────────────────

def check_discrepancy(
    hospital_id: str,
    drug: str,
    counted_stock: int,
    verified_stock: int,
) -> dict:
    """
    Compare counted_stock vs verified_stock.

    Returns a plain dict with discrepancy info if gap < 15% (safe zone).
    Raises PhantomStockException if gap >= 15%.

    Called by prediction.py before building the final response.
    """
    if counted_stock <= 0 and verified_stock <= 0:
        return {"discrepancy_flag": False, "gap_pct": 0.0}

    base = max(counted_stock, 1)
    gap_pct = abs(counted_stock - verified_stock) / base * 100

    result = {
        "discrepancy_flag": False,
        "gap_pct": round(gap_pct, 2),
        "counted_stock": counted_stock,
        "verified_stock": verified_stock,
    }

    if gap_pct >= DISCREPANCY_THRESHOLD_PCT:
        # Log to DB before raising
        _log_discrepancy(hospital_id, drug, gap_pct, counted_stock, verified_stock)
        raise PhantomStockException(hospital_id, drug, gap_pct)

    return result


def check_audit_due(hospital_id: str, drug: str) -> dict:
    """
    Check whether a physical stock audit is overdue for this hospital+drug.

    Returns:
        {
          "audit_due": bool,
          "last_audit": str | None,   -- ISO date of last audit
          "days_since_audit": int | None,
          "prompt": str | None        -- message to show pharmacist
        }
    """
    conn = _get_conn()
    try:
        row = conn.execute(
            """
            SELECT audited_at FROM audit_log
            WHERE hospital_id = ? AND drug = ?
            ORDER BY audited_at DESC LIMIT 1
            """,
            (hospital_id, drug),
        ).fetchone()

        if row is None:
            return {
                "audit_due": True,
                "last_audit": None,
                "days_since_audit": None,
                "prompt": (
                    f"No audit record found for '{drug}' at '{hospital_id}'. "
                    "Please conduct an initial physical stock count."
                ),
            }

        last_dt = datetime.fromisoformat(row["audited_at"])
        days_since = (datetime.now(timezone.utc).replace(tzinfo=None) - last_dt).days

        if days_since > AUDIT_INTERVAL_DAYS:
            return {
                "audit_due": True,
                "last_audit": row["audited_at"],
                "days_since_audit": days_since,
                "prompt": (
                    f"Stock audit overdue for '{drug}' at '{hospital_id}'. "
                    f"Last audit was {days_since} days ago. "
                    "Please conduct a physical count and record the result."
                ),
            }

        return {
            "audit_due": False,
            "last_audit": row["audited_at"],
            "days_since_audit": days_since,
            "prompt": None,
        }
    finally:
        conn.close()


def record_audit(
    hospital_id: str,
    drug: str,
    counted_stock: int,
    verified_stock: int,
    audited_by: str = "pharmacist",
    notes: str = "",
) -> dict:
    """
    Record a completed physical audit.

    Also runs discrepancy check inline — returns a warning dict
    instead of raising so the record is still saved.

    Returns:
        { "recorded": True, "audit_id": int, "discrepancy": dict | None }
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()
    conn = _get_conn()
    try:
        cur = conn.execute(
            """
            INSERT INTO audit_log
                (hospital_id, drug, audited_at, audited_by, counted_stock, verified_stock, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (hospital_id, drug, now, audited_by, counted_stock, verified_stock, notes),
        )
        conn.commit()
        audit_id = cur.lastrowid
    finally:
        conn.close()

    # Run discrepancy check — catch and return rather than propagate
    discrepancy_info = None
    try:
        check_discrepancy(hospital_id, drug, counted_stock, verified_stock)
    except PhantomStockException as e:
        discrepancy_info = e.to_dict()

    return {
        "recorded": True,
        "audit_id": audit_id,
        "audited_at": now,
        "discrepancy": discrepancy_info,
    }


def get_audit_status(hospital_id: str | None = None) -> dict:
    """
    Summary view consumed by /fairness-audit endpoint.

    If hospital_id is given, returns status for that hospital only.
    If None, returns aggregate stats across all hospitals.

    Returns:
        {
          "hospitals_audited": int,
          "overdue_audits": list[dict],
          "open_discrepancies": list[dict],
          "resolved_discrepancies": int,
        }
    """
    conn = _get_conn()
    try:
        # Latest audit per hospital+drug
        if hospital_id:
            rows = conn.execute(
                """
                SELECT hospital_id, drug, MAX(audited_at) as last_audit
                FROM audit_log
                WHERE hospital_id = ?
                GROUP BY hospital_id, drug
                """,
                (hospital_id,),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT hospital_id, drug, MAX(audited_at) as last_audit
                FROM audit_log
                GROUP BY hospital_id, drug
                """
            ).fetchall()

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        overdue = []
        for r in rows:
            last_dt = datetime.fromisoformat(r["last_audit"])
            days_since = (now - last_dt).days
            if days_since > AUDIT_INTERVAL_DAYS:
                overdue.append({
                    "hospital_id": r["hospital_id"],
                    "drug": r["drug"],
                    "days_since_audit": days_since,
                    "last_audit": r["last_audit"],
                })

        # Open discrepancies
        if hospital_id:
            disc_rows = conn.execute(
                """
                SELECT hospital_id, drug, flagged_at, gap_pct, escalated
                FROM discrepancy_log
                WHERE resolved = 0 AND hospital_id = ?
                ORDER BY flagged_at DESC
                """,
                (hospital_id,),
            ).fetchall()
        else:
            disc_rows = conn.execute(
                """
                SELECT hospital_id, drug, flagged_at, gap_pct, escalated
                FROM discrepancy_log
                WHERE resolved = 0
                ORDER BY flagged_at DESC
                """
            ).fetchall()

        resolved_count = conn.execute(
            "SELECT COUNT(*) FROM discrepancy_log WHERE resolved = 1"
        ).fetchone()[0]

        hospitals_audited = conn.execute(
            "SELECT COUNT(DISTINCT hospital_id) FROM audit_log"
        ).fetchone()[0]

        return {
            "hospitals_audited": hospitals_audited,
            "overdue_audits": overdue,
            "open_discrepancies": [dict(r) for r in disc_rows],
            "resolved_discrepancies": resolved_count,
        }
    finally:
        conn.close()


def resolve_discrepancy(discrepancy_id: int, resolved_by: str = "admin") -> dict:
    """
    Mark a discrepancy as resolved (called by admin after investigation).
    """
    conn = _get_conn()
    try:
        conn.execute(
            "UPDATE discrepancy_log SET resolved = 1 WHERE id = ?",
            (discrepancy_id,),
        )
        conn.commit()
        return {"resolved": True, "discrepancy_id": discrepancy_id, "resolved_by": resolved_by}
    finally:
        conn.close()


# ─── Internal Helper ──────────────────────────────────────────────────────────

def _log_discrepancy(
    hospital_id: str,
    drug: str,
    gap_pct: float,
    counted_stock: int,
    verified_stock: int,
) -> None:
    """Write to discrepancy_log. Sets escalated=1 if gap >= ESCALATION_THRESHOLD_PCT."""
    escalated = 1 if gap_pct >= ESCALATION_THRESHOLD_PCT else 0
    now = datetime.now(timezone.utc).replace(tzinfo=None).isoformat()
    conn = _get_conn()
    try:
        conn.execute(
            """
            INSERT INTO discrepancy_log
                (hospital_id, drug, flagged_at, gap_pct, counted_stock, verified_stock, escalated)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (hospital_id, drug, now, round(gap_pct, 2), counted_stock, verified_stock, escalated),
        )
        conn.commit()
    finally:
        conn.close()


# ─── Quick smoke test (python audit.py) ──────────────────────────────────────

if __name__ == "__main__":
    print("=== MediTrace audit.py smoke test ===\n")

    HID = "KRC-001"
    DRUG = "Amoxicillin"

    # 1. No audit on record
    status = check_audit_due(HID, DRUG)
    print("1. Audit due check (no record):", json.dumps(status, indent=2))

    # 2. Record a fresh audit — no discrepancy
    result = record_audit(HID, DRUG, counted_stock=120, verified_stock=118)
    print("\n2. Record audit (no discrepancy):", json.dumps(result, indent=2))

    # 3. Should NOT be overdue immediately after
    status = check_audit_due(HID, DRUG)
    print("\n3. Audit due check (just audited):", json.dumps(status, indent=2))

    # 4. Trigger PhantomStockException (>15% gap)
    print("\n4. Trigger phantom stock (30% gap):")
    try:
        check_discrepancy(HID, DRUG, counted_stock=100, verified_stock=70)
    except PhantomStockException as e:
        print("   PhantomStockException caught:")
        print("  ", json.dumps(e.to_dict(), indent=2))

    # 5. Trigger critical escalation (>25% gap)
    print("\n5. Trigger escalation (40% gap):")
    try:
        check_discrepancy(HID, DRUG, counted_stock=100, verified_stock=60)
    except PhantomStockException as e:
        print("   escalate_to_admin =", e.escalate)
        print("  ", e.message)

    # 6. Audit status summary
    summary = get_audit_status()
    print("\n6. Global audit status:", json.dumps(summary, indent=2))

    # Cleanup test DB
    DB_PATH.unlink(missing_ok=True)
    print("\n✓ Smoke test complete. Test DB removed.")