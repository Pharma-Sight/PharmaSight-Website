"""
crag_evaluator.py — Corrective RAG (CRAG) self-correcting layer for MediTrace.

Architecture position:
  [Prediction Engine] → [CRAG Evaluator] → correct / ambiguous / incorrect
                                              ↓           ↓            ↓
                                          Send alert   Queue for    Discard →
                                                       admin review  fallback → re-predict

Three-path evaluator maps directly onto MediTrace's real-world data quality problem:
  - CORRECT   : Data is internally consistent and recent → proceed with confidence
  - AMBIGUOUS : Data has minor gaps or moderate inconsistency → flag for human review
  - INCORRECT : Data is stale, contradictory, or unreliable → use fallback, re-predict
"""

from __future__ import annotations

import sqlite3
import json
from datetime import datetime, timedelta
from statistics import mean, stdev
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

# ─── Evaluation verdict ───────────────────────────────────────────────────────

class Verdict(str, Enum):
    CORRECT   = "correct"
    AMBIGUOUS = "ambiguous"
    INCORRECT = "incorrect"


# ─── CRAG evaluation result ───────────────────────────────────────────────────

@dataclass
class CRAGResult:
    verdict: Verdict
    confidence_score: float          # 0.0–1.0
    failure_reasons: list[str]       # populated when AMBIGUOUS or INCORRECT
    fallback_used: bool = False
    fallback_source: Optional[str] = None
    corrected_effective_stock: Optional[int] = None
    corrected_daily_avg: Optional[float] = None
    human_review_required: bool = False
    audit_flags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "crag_verdict": self.verdict.value,
            "confidence_score": round(self.confidence_score, 3),
            "failure_reasons": self.failure_reasons,
            "fallback_used": self.fallback_used,
            "fallback_source": self.fallback_source,
            "human_review_required": self.human_review_required,
            "audit_flags": self.audit_flags,
        }


# ─── Thresholds (tunable) ─────────────────────────────────────────────────────

# Max acceptable gap between counted and verified stock before "incorrect"
PHANTOM_STOCK_CRITICAL_PCT = 0.30   # 30 %  → incorrect
PHANTOM_STOCK_WARN_PCT     = 0.15   # 15 %  → ambiguous

# If usage data has high relative std-dev, confidence drops
USAGE_CV_HIGH_THRESHOLD    = 1.2    # coefficient of variation
USAGE_CV_WARN_THRESHOLD    = 0.6

# Data freshness: how old can the last log timestamp be (hours)
DATA_FRESHNESS_CRITICAL_HRS = 72    # 3 days → incorrect
DATA_FRESHNESS_WARN_HRS     = 24    # 1 day  → ambiguous

# Minimum number of daily_usage entries for reliable average
MIN_USAGE_ENTRIES = 3


# ─── Core evaluator ───────────────────────────────────────────────────────────

class CRAGEvaluator:
    """
    Evaluates prediction inputs against three quality dimensions:
      1. Internal consistency  (do the three stock counts agree?)
      2. Usage data quality    (is daily_usage stable and sufficient?)
      3. Data freshness        (was this logged recently?)

    On INCORRECT → automatically pulls regional fallback from SQLite.
    On AMBIGUOUS → returns corrected values but sets human_review_required.
    """

    def __init__(self, db_path: str = "meditrace.db"):
        self.db_path = db_path
        self._init_db()

    # ── DB bootstrap ──────────────────────────────────────────────────────────

    def _init_db(self):
        """Create fallback tables if they don't exist yet."""
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS regional_baselines (
                    drug            TEXT NOT NULL,
                    region          TEXT NOT NULL,
                    hospital_type   TEXT NOT NULL,
                    avg_daily_usage REAL NOT NULL,
                    avg_stock       INTEGER NOT NULL,
                    updated_at      TEXT NOT NULL,
                    PRIMARY KEY (drug, region, hospital_type)
                );

                CREATE TABLE IF NOT EXISTS crag_audit_log (
                    id              INTEGER PRIMARY KEY AUTOINCREMENT,
                    hospital_id     TEXT,
                    drug            TEXT NOT NULL,
                    verdict         TEXT NOT NULL,
                    confidence      REAL NOT NULL,
                    failure_reasons TEXT,
                    fallback_used   INTEGER DEFAULT 0,
                    logged_at       TEXT NOT NULL
                );

                -- Seed some regional baselines for demo / fallback
                INSERT OR IGNORE INTO regional_baselines VALUES
                  ('Amoxicillin', 'Koraput',   'rural',  8.5,  250, '2024-01-01'),
                  ('Amoxicillin', 'Koraput',   'urban',  22.0, 650, '2024-01-01'),
                  ('Insulin',     'Koraput',   'rural',  3.2,  96,  '2024-01-01'),
                  ('Insulin',     'Koraput',   'urban',  9.8,  290, '2024-01-01'),
                  ('Oxytocin',    'Koraput',   'rural',  1.1,  30,  '2024-01-01'),
                  ('Paracetamol', 'Koraput',   'rural',  15.0, 450, '2024-01-01'),
                  ('Paracetamol', 'Koraput',   'urban',  38.0, 1100,'2024-01-01');
            """)

    # ── Main evaluation entry-point ───────────────────────────────────────────

    def evaluate(
        self,
        data,                           # StockInput pydantic model
        hospital_id: str = "unknown",
        region: str = "Koraput",
        last_log_timestamp: Optional[str] = None,
    ) -> CRAGResult:
        """
        Run all checks and return a CRAGResult with verdict + corrected values.

        Args:
            data               : StockInput (the raw pharmacist entry)
            hospital_id        : facility identifier for logging
            region             : geographic region for fallback lookup
            last_log_timestamp : ISO string of when this data was last updated
        """
        reasons: list[str] = []
        audit_flags: list[str] = []
        deduction = 0.0            # confidence penalty accumulator

        # ── Check 1: Phantom stock / internal consistency ─────────────────────
        gap_pct = self._stock_gap_pct(
            data.counted_stock, data.verified_stock
        )
        if gap_pct > PHANTOM_STOCK_CRITICAL_PCT:
            reasons.append(
                f"Critical phantom stock: counted vs verified gap = "
                f"{round(gap_pct * 100)}% (>{int(PHANTOM_STOCK_CRITICAL_PCT*100)}% threshold)"
            )
            audit_flags.append("PHANTOM_STOCK_CRITICAL")
            deduction += 0.55

        elif gap_pct > PHANTOM_STOCK_WARN_PCT:
            reasons.append(
                f"Phantom stock warning: counted vs verified gap = "
                f"{round(gap_pct * 100)}% (>{int(PHANTOM_STOCK_WARN_PCT*100)}% threshold)"
            )
            audit_flags.append("PHANTOM_STOCK_WARNING")
            deduction += 0.25

        # ── Check 2: Usage data sufficiency and stability ─────────────────────
        usage = data.daily_usage
        if len(usage) < MIN_USAGE_ENTRIES:
            reasons.append(
                f"Insufficient usage history: {len(usage)} entries "
                f"(minimum {MIN_USAGE_ENTRIES} required for reliable average)"
            )
            audit_flags.append("INSUFFICIENT_USAGE_DATA")
            deduction += 0.30

        elif len(usage) >= 2:
            cv = self._coefficient_of_variation(usage)
            if cv > USAGE_CV_HIGH_THRESHOLD:
                reasons.append(
                    f"Highly volatile usage data: CV = {round(cv, 2)} "
                    f"(>{USAGE_CV_HIGH_THRESHOLD} — possible data entry errors)"
                )
                audit_flags.append("HIGH_USAGE_VOLATILITY")
                deduction += 0.35
            elif cv > USAGE_CV_WARN_THRESHOLD:
                reasons.append(
                    f"Moderate usage volatility: CV = {round(cv, 2)} — "
                    f"consider reviewing recent entries"
                )
                audit_flags.append("MODERATE_USAGE_VOLATILITY")
                deduction += 0.15

        # ── Check 3: Data freshness ───────────────────────────────────────────
        if last_log_timestamp:
            age_hrs = self._data_age_hours(last_log_timestamp)
            if age_hrs > DATA_FRESHNESS_CRITICAL_HRS:
                reasons.append(
                    f"Stale data: last log was {round(age_hrs, 1)}h ago "
                    f"(>{DATA_FRESHNESS_CRITICAL_HRS}h threshold) — likely connectivity issue"
                )
                audit_flags.append("STALE_DATA_CRITICAL")
                deduction += 0.40
            elif age_hrs > DATA_FRESHNESS_WARN_HRS:
                reasons.append(
                    f"Moderately stale data: last log was {round(age_hrs, 1)}h ago"
                )
                audit_flags.append("STALE_DATA_WARNING")
                deduction += 0.20

        # ── Compute confidence and classify verdict ───────────────────────────
        confidence = max(0.0, 1.0 - deduction)

        if deduction >= 0.55:
            verdict = Verdict.INCORRECT
        elif deduction >= 0.20:
            verdict = Verdict.AMBIGUOUS
        else:
            verdict = Verdict.CORRECT

        # ── On INCORRECT: pull fallback and produce corrected values ──────────
        corrected_stock = None
        corrected_avg   = None
        fallback_used   = False
        fallback_source = None

        if verdict == Verdict.INCORRECT:
            fb = self._get_regional_fallback(data.drug, region, data.hospital_type)
            if fb:
                corrected_stock = fb["avg_stock"]
                corrected_avg   = fb["avg_daily_usage"]
                fallback_used   = True
                fallback_source = (
                    f"Regional baseline — {region} {data.hospital_type} hospitals "
                    f"(updated {fb['updated_at']})"
                )
            else:
                # No regional baseline exists — force human review
                verdict = Verdict.AMBIGUOUS
                reasons.append(
                    "No regional fallback available — escalating to human review"
                )

        # ── Log to audit table ────────────────────────────────────────────────
        self._log_audit(
            hospital_id=hospital_id,
            drug=data.drug,
            verdict=verdict,
            confidence=confidence,
            failure_reasons=reasons,
            fallback_used=fallback_used,
        )

        return CRAGResult(
            verdict=verdict,
            confidence_score=confidence,
            failure_reasons=reasons,
            fallback_used=fallback_used,
            fallback_source=fallback_source,
            corrected_effective_stock=corrected_stock,
            corrected_daily_avg=corrected_avg,
            human_review_required=(verdict == Verdict.AMBIGUOUS),
            audit_flags=audit_flags,
        )

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _stock_gap_pct(counted: int, verified: int) -> float:
        if max(counted, verified) == 0:
            return 0.0
        return abs(counted - verified) / max(counted, verified)

    @staticmethod
    def _coefficient_of_variation(values: list[float]) -> float:
        if len(values) < 2:
            return 0.0
        avg = mean(values)
        if avg == 0:
            return 0.0
        return stdev(values) / avg

    @staticmethod
    def _data_age_hours(timestamp_iso: str) -> float:
        try:
            logged = datetime.fromisoformat(timestamp_iso)
            return (datetime.utcnow() - logged).total_seconds() / 3600
        except ValueError:
            return 0.0  # unparseable timestamp → treat as fresh

    def _get_regional_fallback(
        self, drug: str, region: str, hospital_type: str
    ) -> Optional[dict]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute(
                """SELECT avg_daily_usage, avg_stock, updated_at
                   FROM regional_baselines
                   WHERE drug = ? AND region = ? AND hospital_type = ?""",
                (drug, region, hospital_type),
            ).fetchone()
            return dict(row) if row else None

    def _log_audit(
        self,
        hospital_id: str,
        drug: str,
        verdict: Verdict,
        confidence: float,
        failure_reasons: list[str],
        fallback_used: bool,
    ):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """INSERT INTO crag_audit_log
                   (hospital_id, drug, verdict, confidence,
                    failure_reasons, fallback_used, logged_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    hospital_id,
                    drug,
                    verdict.value,
                    confidence,
                    json.dumps(failure_reasons),
                    int(fallback_used),
                    datetime.utcnow().isoformat(),
                ),
            )
