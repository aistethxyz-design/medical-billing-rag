"""
Convert RAG/Codes_by_class.csv -> RAG/Codes_by_class.json

Source CSV columns: Code, Description, How to Use, Amount ($CAD), <trailing empty>

For each row we emit:
{
  "code": str,
  "description": str,
  "how_to_use": str,
  "amount": float | None,            # primary $ amount (first dollar value found)
  "amount_raw": str,                 # original text from the Amount column
  "amount_variants": {label: float}, # e.g. {"weekday": 20.65, "weekend": 41.15}
  "bonus": {"type": "percent", "value": 20.0} | None,
  "time_of_day": [str]               # any of: Day, Evening, Night, Weekend, Holiday, AfterHours
}

We skip fully blank separator rows. We keep duplicates (same code, different
description / time slot) because the source treats them as distinct billing
scenarios.
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

SRC = Path(__file__).resolve().parent / "Codes_by_class.csv"
DST = Path(__file__).resolve().parent / "Codes_by_class.json"

# $123 or $1,234.56  (capture group 1 = number)
_DOLLAR_RE = re.compile(r"\$\s*([\d,]+(?:\.\d+)?)")
# bare numbers like 67.8 or 134.55 (used as fallback when no $ sign)
_NUM_RE = re.compile(r"(?<![\w.])(\d+(?:\.\d+)?)")
# percent like "20%" or "add 50%"
_PCT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*%")
# pairs of "$amt (label)"
_LABELED_DOLLAR_RE = re.compile(
    r"\$\s*([\d,]+(?:\.\d+)?)\s*\(\s*([^)]+?)\s*\)",
    re.IGNORECASE,
)

# Time-of-day keywords. Order matters so longer phrases win when needed.
_TOD_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("Holiday", re.compile(r"\bholidays?\b", re.IGNORECASE)),
    ("Weekend", re.compile(r"\bweekend(?:s)?\b", re.IGNORECASE)),
    ("Night", re.compile(r"\bnight\b|\b0000\s*-\s*0[78]00\b|\b2400\s*-\s*0700\b", re.IGNORECASE)),
    ("Evening", re.compile(r"\bevening(?:s)?\b|\b1700\s*-\s*0000\b|\b1800\s*-\s*2400\b", re.IGNORECASE)),
    ("AfterHours", re.compile(r"after[\s-]?hours?", re.IGNORECASE)),
    ("Day", re.compile(r"\b0800\s*-\s*1700\b|\bweekday(?:s)?\b|\bdaytime\b", re.IGNORECASE)),
]


def _to_float(num_str: str) -> float | None:
    try:
        return float(num_str.replace(",", ""))
    except ValueError:
        return None


def parse_amount_field(raw: str) -> tuple[float | None, dict[str, float], dict | None]:
    """
    Returns (primary_amount, amount_variants, bonus).

    - amount_variants captures labeled splits like "$20.65 (weekday), $41.15 (weekend)".
    - bonus is set when the amount represents a percentage (e.g. "20% bonus", "add 50%").
    """
    amount_variants: dict[str, float] = {}
    bonus: dict | None = None
    primary: float | None = None

    if not raw:
        return None, amount_variants, bonus

    # 1) Labeled $ pairs first (preserve order)
    for m in _LABELED_DOLLAR_RE.finditer(raw):
        val = _to_float(m.group(1))
        label = m.group(2).strip().lower()
        if val is not None and label:
            amount_variants[label] = val

    # 2) Primary $ amount (the first dollar value, even if it's part of a labeled pair)
    dollar_match = _DOLLAR_RE.search(raw)
    if dollar_match:
        primary = _to_float(dollar_match.group(1))

    # 3) Percent / bonus handling — only treat as bonus if there is no $ amount
    if primary is None:
        pct_match = _PCT_RE.search(raw)
        if pct_match:
            pct_val = _to_float(pct_match.group(1))
            if pct_val is not None:
                bonus = {"type": "percent", "value": pct_val, "text": raw}
        else:
            # 4) Bare number fallback (some rows store the amount without a $)
            bare = _NUM_RE.search(raw)
            if bare:
                primary = _to_float(bare.group(1))

    return primary, amount_variants, bonus


def detect_time_of_day(*texts: str) -> list[str]:
    found: list[str] = []
    haystack = " \n ".join(t for t in texts if t)
    if not haystack:
        return found
    for label, pat in _TOD_PATTERNS:
        if pat.search(haystack) and label not in found:
            found.append(label)
    return found


def main() -> None:
    rows: list[dict] = []
    with SRC.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for raw in reader:
            code = (raw.get("Code") or "").strip()
            description = (raw.get("Description") or "").strip()
            how_to_use = (raw.get("How to Use") or "").strip()
            amount_raw = (raw.get("Amount ($CAD)") or "").strip()

            # Skip fully-empty separator rows
            if not (code or description or how_to_use or amount_raw):
                continue

            amount, variants, bonus = parse_amount_field(amount_raw)
            tod = detect_time_of_day(description, how_to_use, amount_raw)

            rows.append(
                {
                    "code": code,
                    "description": description,
                    "how_to_use": how_to_use,
                    "amount": amount,
                    "amount_raw": amount_raw,
                    "amount_variants": variants,
                    "bonus": bonus,
                    "time_of_day": tod,
                }
            )

    DST.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(rows)} records to {DST}")

    # Quick sanity counters
    n_variants = sum(1 for r in rows if r["amount_variants"])
    n_bonus = sum(1 for r in rows if r["bonus"])
    n_tod = sum(1 for r in rows if r["time_of_day"])
    print(f"  with amount_variants: {n_variants}")
    print(f"  with bonus:           {n_bonus}")
    print(f"  with time_of_day:     {n_tod}")


if __name__ == "__main__":
    main()
