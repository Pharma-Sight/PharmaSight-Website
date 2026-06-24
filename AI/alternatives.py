"""
alternatives.py — MediTrace Stage 4: Gemini RAG Drug Alternatives
------------------------------------------------------------------
Calls Gemini 1.5 Pro to suggest 3 clinically relevant alternatives
when a drug is at shortage risk. Returns structured JSON.

No external libraries beyond google-generativeai.
API key loaded exclusively from .env via python-dotenv.
"""

import os
import json
import re
import logging
from dataclasses import dataclass, field

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# ── Logging ──────────────────────────────────────────────────────────────────
logger = logging.getLogger(__name__)

# ── Gemini client init ────────────────────────────────────────────────────────
_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    raise EnvironmentError(
        "GEMINI_API_KEY is not set. "
        "Add it to your .env file and never hardcode it."
    )

genai.configure(api_key=_api_key)
_model = genai.GenerativeModel("gemini-1.5-pro")

# ── Custom exceptions ─────────────────────────────────────────────────────────
class AlternativesError(Exception):
    """Raised when Gemini fails to return valid alternatives."""


class AlternativesParseError(AlternativesError):
    """Raised when the Gemini response cannot be parsed as expected JSON."""


# ── Data types ────────────────────────────────────────────────────────────────
@dataclass
class DrugAlternative:
    drug: str
    match_pct: int          # 0–100 therapeutic match percentage
    key_difference: str     # one-line clinical note


@dataclass
class AlternativesResponse:
    drug_queried: str
    hospital_type: str
    alternatives: list[DrugAlternative] = field(default_factory=list)
    gemini_raw: str = ""    # kept for audit / debugging; not returned to client


# ── Helpers ───────────────────────────────────────────────────────────────────
def _strip_markdown_fences(text: str) -> str:
    """
    Gemini sometimes wraps JSON in ```json ... ``` blocks.
    This strips those fences so json.loads() works cleanly.
    """
    cleaned = re.sub(r"```(?:json)?", "", text, flags=re.IGNORECASE).strip()
    # Also strip trailing backtick-only lines
    cleaned = re.sub(r"```$", "", cleaned, flags=re.MULTILINE).strip()
    return cleaned


def _validate_alternatives(raw_list: list) -> list[DrugAlternative]:
    """
    Validates and coerces each item in the parsed list.
    Raises AlternativesParseError if required keys are missing.
    """
    required_keys = {"drug", "match_pct", "key_difference"}
    results: list[DrugAlternative] = []

    for i, item in enumerate(raw_list):
        missing = required_keys - item.keys()
        if missing:
            raise AlternativesParseError(
                f"Alternative #{i + 1} is missing required fields: {missing}. "
                f"Raw item: {item}"
            )
        results.append(
            DrugAlternative(
                drug=str(item["drug"]).strip(),
                match_pct=int(item["match_pct"]),
                key_difference=str(item["key_difference"]).strip(),
            )
        )

    return results


# ── Core function ─────────────────────────────────────────────────────────────
def get_alternatives(drug: str, hospital_type: str = "rural") -> AlternativesResponse:
    """
    Query Gemini 1.5 Pro for 3 therapeutic alternatives to the given drug.

    Args:
        drug:          Name of the drug that is at shortage risk.
        hospital_type: "rural" or "urban" — used to bias suggestions toward
                       drugs that are realistically available in that setting.

    Returns:
        AlternativesResponse with a list of up to 3 DrugAlternative objects.

    Raises:
        AlternativesError:      On Gemini API or network failure.
        AlternativesParseError: If the response JSON is malformed.
    """
    setting_context = (
        "a rural Indian primary health centre with limited formulary access"
        if hospital_type == "rural"
        else "an urban Indian district hospital"
    )

    prompt = (
        f"{drug} is facing a shortage at {setting_context}. "
        f"Suggest exactly 3 alternative drugs a clinician could use instead. "
        f"Return ONLY a valid JSON array — no explanation, no markdown, no preamble. "
        f"Each object must have exactly these keys:\n"
        f'  "drug"           : string — name of the alternative drug\n'
        f'  "match_pct"      : integer 0–100 — therapeutic equivalence percentage\n'
        f'  "key_difference" : string — one sentence on the most important clinical difference\n\n'
        f"Example format (do not copy this data):\n"
        f'[{{"drug":"ExampleDrug","match_pct":85,"key_difference":"Shorter half-life requires twice-daily dosing."}}]'
    )

    logger.info("Querying Gemini for alternatives: drug=%s, setting=%s", drug, hospital_type)

    try:
        response = _model.generate_content(prompt)
        raw_text = response.text
    except Exception as exc:
        raise AlternativesError(
            f"Gemini API call failed for drug '{drug}': {exc}"
        ) from exc

    logger.debug("Gemini raw response: %s", raw_text)

    # Strip markdown fences that Gemini sometimes adds
    clean_text = _strip_markdown_fences(raw_text)

    try:
        parsed = json.loads(clean_text)
    except json.JSONDecodeError as exc:
        raise AlternativesParseError(
            f"Could not parse Gemini response as JSON for drug '{drug}'. "
            f"Raw response: {raw_text!r}. Error: {exc}"
        ) from exc

    if not isinstance(parsed, list):
        raise AlternativesParseError(
            f"Expected a JSON array from Gemini, got {type(parsed).__name__}. "
            f"Raw: {raw_text!r}"
        )

    alternatives = _validate_alternatives(parsed)

    return AlternativesResponse(
        drug_queried=drug,
        hospital_type=hospital_type,
        alternatives=alternatives,
        gemini_raw=raw_text,    # stored for audit; stripped before API response
    )


# ── Serialisation helper (used by main.py) ────────────────────────────────────
def alternatives_to_dict(resp: AlternativesResponse) -> dict:
    """
    Convert AlternativesResponse to a plain dict safe for JSON serialisation.
    gemini_raw is intentionally excluded from the outbound response.
    """
    return {
        "drug_queried": resp.drug_queried,
        "hospital_type": resp.hospital_type,
        "alternatives": [
            {
                "drug": alt.drug,
                "match_pct": alt.match_pct,
                "key_difference": alt.key_difference,
            }
            for alt in resp.alternatives
        ],
    }


# ── Smoke test (run directly: python alternatives.py) ─────────────────────────
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    test_drug = "Amoxicillin"
    print(f"\n── Smoke test: alternatives for '{test_drug}' at a rural hospital ──")

    try:
        result = get_alternatives(test_drug, hospital_type="rural")
        output = alternatives_to_dict(result)
        print(json.dumps(output, indent=2))
    except AlternativesError as e:
        print(f"[ERROR] {e}")