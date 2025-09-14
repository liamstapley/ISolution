# scripts/import_events_from_csv.py
# One-off CSV → DB importer for Events.
# Usage: python scripts/import_events_from_csv.py [path/to/events.csv]

import os, sys, csv, re
from datetime import datetime, date, time
from zoneinfo import ZoneInfo
from typing import Optional
from pathlib import Path

# ------------------------------------------------------
# Project paths & CSV defaults
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV = PROJECT_ROOT / "external_data" / "events.csv"

# Allow override via CLI: python scripts/import_events_from_csv.py path/to/file.csv
CSV_PATH = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_CSV
if not CSV_PATH.exists():
    raise FileNotFoundError(f"CSV not found: {CSV_PATH}")

# Timezone for combining date+time
TZ = ZoneInfo("America/New_York")

# Column mapping from CSV headers → Event fields
COLS = {
    "title": "Title",
    "description": "Description",
    "src_url": "Source URL",         # was apply_url → now src_url
    "date": "Date",
    "start_time": "Start Time",
    "end_time": "End Time",
    "venue": "Venue",
    "location": "Location",
    "company": "Company",            # → organizers
    "tags": "Tags",                  # comma/semicolon separated
    "category": "Category",          # <-- NEW: merge this into tags
    "price_amount": "Price",
    "price_currency": "Currency",
    "people_cap": "Capacity",
    "latitude": "Latitude",
    "longitude": "Longitude",
}
# ------------------------------------------------------
# Import app DB (scripts/ is sibling to backend/)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.append(ROOT)

from database import SessionLocal, engine
from models import Event, Base  # Event has: src_url, starts_at/ends_at (ISO strings), evidence_urls (JSON/list)

# Ensure tables exist in the target DB file
Base.metadata.create_all(bind=engine)

# ------------------------------------------------------
# Helpers

def _parse_date_loose(s: str) -> Optional[date]:
    """
    Robust date parser for messy CSVs.
    - Accepts:
        * YYYY-MM-DD
        * MM/DD/YYYY, MM/DD/YY
        * 'Sep 1 2025', 'September 1, 2025', etc.
        * 'September 1 through November 30[, 2025]' -> returns start date
        * 'Daily'/'Weekly'/'Ongoing'/'Various'/'Multiple dates' -> returns today
        * 'Month Day' (no year) -> assumes current year (or next year if past)
        * ISO strings -> returns their date part
    - Returns None if it cannot parse.
    """
    s = (s or "").strip()
    if not s:
        return None

    # If includes time like "2025-09-20 19:00", take date portion
    if re.match(r"^\d{4}-\d{2}-\d{2}\s+\d", s):
        s = s.split(" ")[0]

    # Remove ordinal suffixes (1st, 2nd, 3rd, 4th)
    s_norm = re.sub(r"(\d+)(st|nd|rd|th)\b", r"\1", s, flags=re.IGNORECASE)

    # Ranges: "September 1 through November 30[, 2025]" or "Sep 1 to Nov 30, 2025"
    m = re.search(
        r"^\s*([A-Za-z]+\.?\s+\d{1,2})(?:,?\s*(\d{4}))?\s+(?:to|through|-)\s+([A-Za-z]+\.?\s+\d{1,2})(?:,?\s*(\d{4}))?\s*$",
        s_norm,
        re.IGNORECASE,
    )
    if m:
        start_str, start_year, end_str, end_year = m.groups()
        # Prefer explicit year if present (start or end)
        yr = start_year or end_year
        if yr:
            for fmt in ("%B %d %Y", "%b %d %Y"):
                try:
                    return datetime.strptime(f"{start_str} {yr}", fmt).date()
                except ValueError:
                    continue
        # No explicit year → assume current year
        yr = datetime.now(TZ).year
        for fmt in ("%B %d %Y", "%b %d %Y"):
            try:
                return datetime.strptime(f"{start_str} {yr}", fmt).date()
            except ValueError:
                continue
        return None

    # Keywords → treat as recurring; choose policy: set to "today"
    if s_norm.lower() in {"daily", "weekly", "ongoing", "various", "multiple dates"}:
        return datetime.now(TZ).date()

    # "Month Day" (no year) → assume this year (or next if already passed)
    m2 = re.match(r"^\s*([A-Za-z]+)\.?\s+(\d{1,2})\s*$", s_norm)
    if m2:
        mon, day = m2.groups()
        yr = datetime.now(TZ).year
        for fmt in ("%B %d %Y", "%b %d %Y"):
            try:
                dt = datetime.strptime(f"{mon} {day} {yr}", fmt).date()
                if dt < datetime.now(TZ).date():
                    dt = dt.replace(year=yr + 1)
                return dt
            except ValueError:
                continue

    # Try common explicit formats
    for fmt in (
        "%Y-%m-%d",
        "%m/%d/%Y", "%m/%d/%y",
        "%b %d %Y",  "%B %d %Y",
        "%b %d, %Y", "%B %d, %Y",
    ):
        try:
            return datetime.strptime(s_norm, fmt).date()
        except ValueError:
            continue

    # ISO-ish fallback
    try:
        return datetime.fromisoformat(s_norm).date()
    except Exception:
        pass

    return None


def _parse_time_loose(s: str) -> Optional[time]:
    s = (s or "").strip().lower()
    if not s or s in {"tbd", "n/a", "na"}:
        return None
    if s in {"noon", "12 noon"}:
        return time(12, 0)
    if s in {"midnight", "12 midnight"}:
        return time(0, 0)
    # Normalize "7pm" → "7 pm"
    s = re.sub(r"(\d)(am|pm)$", r"\1 \2", s)
    for fmt in ("%H:%M", "%H:%M:%S", "%I:%M %p", "%I %p"):
        try:
            return datetime.strptime(s.upper(), fmt).time()
        except ValueError:
            continue
    return None


def _csv_to_str(s: Optional[str]) -> Optional[str]:
    if s is None:
        return None
    parts = [p.strip() for p in str(s).replace(";", ",").split(",")]
    parts = [p for p in parts if p]
    return ",".join(parts) if parts else None


def _merge_tags(*values: Optional[str]) -> Optional[str]:
    """Merge multiple tag strings (comma/semicolon separated), dedupe case-insensitively, preserve original case/order."""
    seen = set()
    out = []
    for v in values:
        if not v:
            continue
        parts = [p.strip() for p in str(v).replace(";", ",").split(",")]
        for p in parts:
            if not p:
                continue
            key = p.lower()
            if key not in seen:
                seen.add(key)
                out.append(p)
    return ",".join(out) if out else None


def _to_float(s: Optional[str]) -> Optional[float]:
    try:
        return float(str(s).replace("$", "").strip()) if str(s).strip() else None
    except Exception:
        return None


def _to_int(s: Optional[str]) -> Optional[int]:
    try:
        return int(str(s).strip()) if str(s).strip() else None
    except Exception:
        return None


def _combine_iso(d: date, t: Optional[time]) -> Optional[str]:
    if t is None:
        return None
    return datetime(d.year, d.month, d.day, t.hour, t.minute, tzinfo=TZ).isoformat()

# ------------------------------------------------------
# Main

def main():
    db = SessionLocal()
    inserted = 0
    skipped = 0
    problems = []

    with open(CSV_PATH, "r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, start=2):  # header is row 1
            title = (row.get(COLS["title"]) or "").strip()
            if not title:
                skipped += 1
                problems.append((idx, "(no title)", "missing title"))
                continue

            raw_date = (row.get(COLS["date"]) or "").strip()
            d = _parse_date_loose(raw_date)
            if not d:
                skipped += 1
                problems.append((idx, title[:60], f"bad date: {raw_date!r}"))
                continue

            t_start = _parse_time_loose(row.get(COLS["start_time"], ""))
            t_end   = _parse_time_loose(row.get(COLS["end_time"], ""))

            # Merge Tags + Category, then possibly add 'recurring'
            tags_from_csv = row.get(COLS["tags"])
            category_from_csv = row.get(COLS["category"])
            tags = _merge_tags(tags_from_csv, category_from_csv)

            if raw_date.lower() in {"daily", "weekly", "ongoing", "various", "multiple dates"}:
                tags = _merge_tags(tags, "recurring")

            ev = Event(
                title=title,
                description=(row.get(COLS["description"]) or "").strip() or None,
                src_url=(row.get(COLS["src_url"]) or "").strip() or None,
                starts_at=_combine_iso(d, t_start) or _combine_iso(d, time(0, 0)),
                ends_at=_combine_iso(d, t_end),
                venue=(row.get(COLS["venue"]) or "").strip() or None,
                location=(row.get(COLS["location"]) or "").strip() or "TBD",
                latitude=_to_float(row.get(COLS["latitude"])),
                longitude=_to_float(row.get(COLS["longitude"])),
                tags=tags,
                organizers=_csv_to_str(row.get(COLS["company"])),  # company → organizers
                price_amount=_to_float(row.get(COLS["price_amount"])),
                price_currency=(row.get(COLS["price_currency"]) or "").strip() or None,
                people_cap=_to_int(row.get(COLS["people_cap"])),
                source="cache",   # keep within allowed enum for API responses
                evidence_urls=[], # keep as empty list unless you have sources
            )

            db.add(ev)
            inserted += 1

    db.commit()

    print(f"Imported {inserted} events from {os.path.relpath(CSV_PATH)}; skipped {skipped}.")
    if problems:
        print("Skipped rows (first 15):")
        for r in problems[:15]:
            print(f"  row {r[0]}: {r[1]} -> {r[2]}")


if __name__ == "__main__":
    main()
