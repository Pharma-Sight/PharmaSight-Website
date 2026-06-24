"""
anomaly.py — MediTrace Stage 3: Anomaly Detection
==================================================
Detects unusual consumption spikes in daily drug usage.

Rules (from build checklist):
  • historical_avg = mean(daily_usage[:-1])
  • today          = daily_usage[-1]
  • anomaly        = True  if today > avg × 1.5
  • spike_ratio    = round(today / avg, 2)
  • severity       = CRITICAL if spike_ratio >= 2.0 else WATCH

Conservative constraint: same effective_stock logic as prediction.py
is available here but not the primary focus — this module is purely
about the USAGE pattern, not stock levels.

Raises:
  InsufficientUsageDataError — when daily_usage has < 2 data points.
"""

from statistics import mean
from typing import Any

# ── shared input model (imported from main.py in production) ─────────────────
# Kept here as a local dataclass so anomaly.py is independently testable.
from dataclasses import dataclass, field


@dataclass
class StockInput:
    drug: str
    counted_stock: int
    usable_stock: int
    verified_stock: int
    daily_usage: list[float]
    hospital_type: str          # "rural" | "urban"
    cold_chain_intact: bool
    batches: list[dict] = field(default_factory=list)


# ── custom exception ─────────────────────────────────────────────────────────

class InsufficientUsageDataError(ValueError):
    """Raised when daily_usage contains fewer than 2 data points.

    Anomaly detection requires at least one historical day and one
    'today' observation. A single-element list makes the mean
    mathematically undefined in context and statistically meaningless.
    """
    def __init__(self, length: int):
        super().__init__(
            f"daily_usage must have at least 2 entries to detect anomalies "
            f"(received {length}). Add more historical usage data."
        )
        self.length = length


# ── core detection function ──────────────────────────────────────────────────

def detect_spike(data: StockInput) -> dict[str, Any]:
    """
    Analyse the daily_usage list for consumption spikes.

    Parameters
    ----------
    data : StockInput
        Full validated stock input. Only daily_usage is read here.

    Returns
    -------
    dict with keys:
        drug            str   — drug name echoed back
        anomaly         bool  — True if spike detected
        today_usage     float — last element in daily_usage
        historical_avg  float — mean of all but last element
        spike_ratio     float — today / avg  (1.00 = normal; >1.5 = anomaly)
        severity        str   — "NONE" | "WATCH" | "CRITICAL"
        reason          str   — human-readable explanation for dashboard

    Raises
    ------
    InsufficientUsageDataError
        If daily_usage has fewer than 2 elements.
    """

    usage = data.daily_usage

    # ── Guard: need at least 1 historical day + today ────────────────────────
    if len(usage) < 2:
        raise InsufficientUsageDataError(len(usage))

    historical: list[float] = usage[:-1]
    today: float             = usage[-1]
    avg: float               = mean(historical)

    # ── Guard: zero average (all historical days had zero usage) ─────────────
    if avg == 0:
        if today == 0:
            return _build_result(
                drug=data.drug,
                anomaly=False,
                today=today,
                avg=avg,
                ratio=1.0,
                severity="NONE",
                reason="All usage values are zero — no baseline to compare.",
            )
        # any non-zero today against a zero baseline is effectively infinite
        return _build_result(
            drug=data.drug,
            anomaly=True,
            today=today,
            avg=avg,
            ratio=float("inf"),
            severity="CRITICAL",
            reason=(
                f"{data.drug}: historical average was 0 units/day but "
                f"{today:.1f} units were consumed today. Possible emergency "
                "surge or data entry error."
            ),
        )

    # ── Core spike logic ─────────────────────────────────────────────────────
    spike_ratio: float = round(today / avg, 2)
    anomaly: bool      = spike_ratio > 1.5       # strictly greater than

    # Severity buckets
    if not anomaly:
        severity = "NONE"
    elif spike_ratio >= 2.0:
        severity = "CRITICAL"
    else:
        severity = "WATCH"

    # Human-readable reason string
    reason = _build_reason(data.drug, today, avg, spike_ratio, anomaly, severity)

    return _build_result(
        drug=data.drug,
        anomaly=anomaly,
        today=today,
        avg=avg,
        ratio=spike_ratio,
        severity=severity,
        reason=reason,
    )


# ── helpers ──────────────────────────────────────────────────────────────────

def _build_reason(
    drug: str,
    today: float,
    avg: float,
    ratio: float,
    anomaly: bool,
    severity: str,
) -> str:
    if not anomaly:
        return (
            f"{drug}: today's usage ({today:.1f}) is within normal range "
            f"(avg {avg:.1f}/day, ratio {ratio:.2f}×). No action needed."
        )

    base = (
        f"{drug}: today's usage ({today:.1f} units) is {ratio:.2f}× the "
        f"historical average ({avg:.1f}/day)."
    )

    if severity == "CRITICAL":
        return (
            base + " CRITICAL spike — possible disease outbreak, bulk dispensing"
            " error, or theft. Verify physical stock immediately and cross-check"
            " patient records."
        )
    else:
        return (
            base + " Usage is elevated. Monitor closely. If the pattern"
            " continues tomorrow, escalate to pharmacist for review."
        )


def _build_result(
    drug: str,
    anomaly: bool,
    today: float,
    avg: float,
    ratio: float,
    severity: str,
    reason: str,
) -> dict[str, Any]:
    return {
        "drug":           drug,
        "anomaly":        anomaly,
        "today_usage":    round(today, 2),
        "historical_avg": round(avg, 2),
        "spike_ratio":    ratio,
        "severity":       severity,
        "reason":         reason,
    }


# ── quick self-test (python anomaly.py) ──────────────────────────────────────
if __name__ == "__main__":
    import json

    cases = [
        {
            "label": "Normal usage",
            "data": StockInput(
                drug="Amoxicillin",
                counted_stock=500, usable_stock=480, verified_stock=490,
                daily_usage=[30, 28, 32, 29, 31, 30],   # today=30, avg≈30
                hospital_type="rural",
                cold_chain_intact=True,
            ),
        },
        {
            "label": "WATCH spike (1.6×)",
            "data": StockInput(
                drug="Paracetamol",
                counted_stock=300, usable_stock=290, verified_stock=295,
                daily_usage=[20, 22, 21, 20, 33],        # today=33, avg≈20.75
                hospital_type="urban",
                cold_chain_intact=True,
            ),
        },
        {
            "label": "CRITICAL spike (2.5×)",
            "data": StockInput(
                drug="Insulin",
                counted_stock=100, usable_stock=95, verified_stock=98,
                daily_usage=[10, 9, 11, 10, 25],         # today=25, avg=10
                hospital_type="rural",
                cold_chain_intact=False,
            ),
        },
        {
            "label": "Zero baseline — today non-zero",
            "data": StockInput(
                drug="Oxytocin",
                counted_stock=50, usable_stock=50, verified_stock=50,
                daily_usage=[0, 0, 0, 5],
                hospital_type="rural",
                cold_chain_intact=True,
            ),
        },
    ]

    for case in cases:
        print(f"\n── {case['label']} ──")
        result = detect_spike(case["data"])
        print(json.dumps(result, indent=2))

    # Test exception path
    print("\n── InsufficientUsageDataError test ──")
    try:
        detect_spike(StockInput(
            drug="TestDrug",
            counted_stock=100, usable_stock=100, verified_stock=100,
            daily_usage=[42],          # only one entry — should raise
            hospital_type="urban",
            cold_chain_intact=True,
        ))
    except InsufficientUsageDataError as e:
        print(f"Caught expected error: {e}")