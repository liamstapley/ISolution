import os
import google.genai as genai
from google.genai import types
from typing import List, Sequence, Optional
from dotenv import load_dotenv

load_dotenv() # Tested to be necessary
EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL")
assert(EMBED_MODEL)
OUTPUT_DIM = 1536

client = genai.Client()

def _embed_single(text: str, task_type: str) -> List[float]:
    cfg = types.EmbedContentConfig(task_type=task_type)
    cfg = types.EmbedContentConfig(task_type=task_type, output_dimensionality=OUTPUT_DIM)

    # Note: API accepts a single string or a list of strings ("contents")
    result = client.models.embed_content(
        model=EMBED_MODEL,
        contents=text,
        config=cfg,
    )
    # result.embeddings is a list of Embedding objects; take first
    [embedding_obj] = result.embeddings
    return list(embedding_obj.values)

def _embed_batch(texts: Sequence[str], task_type: str) -> List[List[float]]:
    cfg = types.EmbedContentConfig(task_type=task_type)
    cfg = types.EmbedContentConfig(task_type=task_type, output_dimensionality=OUTPUT_DIM)

    result = client.models.embed_content(
        model=EMBED_MODEL,
        contents=list(texts),
        config=cfg,
    )
    return [list(e.values) for e in result.embeddings]

def embed_document(text: str) -> List[float]:
    """Document-side vectors for your events (RETRIEVAL_DOCUMENT)."""
    return _embed_single(text, task_type="RETRIEVAL_DOCUMENT")

def embed_query(text: str) -> List[float]:
    """Query-side vectors for user intent (RETRIEVAL_QUERY)."""
    return _embed_single(text, task_type="RETRIEVAL_QUERY")

def embed_documents(texts: Sequence[str]) -> List[List[float]]:
    """Batch version for documents."""
    return _embed_batch(texts, task_type="RETRIEVAL_DOCUMENT")

def event_text(title: str, tags: str, orgs: str, starts_at: str, location: str, summary: str) -> str:
    """Canonical event text used for embedding."""
    return f"""title: {title}
tags: {tags or ""}
org: {orgs or ""}
when: {starts_at}
where: {location}
summary: {summary or ""}"""

def user_text(user) -> str:
    """
    Canonical user text used for embedding (key:value lines).
    Mirrors event_text formatting to improve user↔event similarity.
    Excludes PII (name/username/password).

    Lines (in fixed order, omitted if missing):
      age: <int>
      role: <school_or_career_type>
      tags: <interests CSV normalized>
      cares: <causes_interested CSV normalized>
      wake_time: HH:MM
      sleep_time: HH:MM
      preferred_days: mon, tue, fri
      personality: INTP
      where: City, State
    """

    def _csv_to_list(s: Optional[str]) -> List[str]:
        if not s:
            return []
        # Trim entries and drop empties
        return [x.strip() for x in s.split(",") if x and x.strip()]

    def _norm_csv(s: Optional[str], lowercase: bool = True) -> Optional[str]:
        items = _csv_to_list(s)
        if lowercase:
            items = [x.lower() for x in items]
        return ", ".join(items) if items else None

    lines: List[str] = []

    # 1) age
    if isinstance(getattr(user, "age", None), int):
        lines.append(f"age: {user.age}")

    # 2) role (school_or_career_type)
    role = (getattr(user, "school_or_career_type", None) or "").strip()
    if role:
        lines.append(f"role: {role}")

    # 3) tags (from interests)
    interests_norm = _norm_csv(getattr(user, "interests", None), lowercase=True)
    if interests_norm:
        lines.append(f"tags: {interests_norm}")

    # 4) cares (from causes_interested)
    causes_norm = _norm_csv(getattr(user, "causes_interested", None), lowercase=True)
    if causes_norm:
        lines.append(f"cares: {causes_norm}")

    # 5) wake_time / sleep_time
    wake = (getattr(user, "wake_time", None) or "").strip()
    if wake:
        lines.append(f"wake_time: {wake}")

    sleep = (getattr(user, "sleep_time", None) or "").strip()
    if sleep:
        lines.append(f"sleep_time: {sleep}")

    # 6) preferred_days (normalize to lowercase short tokens)
    days_norm = _norm_csv(getattr(user, "preferred_days", None), lowercase=True)
    if days_norm:
        lines.append(f"preferred_days: {days_norm}")

    # 7) personality (keep original casing like INTP)
    personality = (getattr(user, "personality_type", None) or "").strip()
    if personality:
        lines.append(f"personality: {personality}")

    # 8) where (location) — match event_text's "where"
    loc = (getattr(user, "location", None) or "").strip()
    if loc:
        lines.append(f"where: {loc}")

    # Fallback to a stable token rather than empty string
    if not lines:
        return "user: no details"
    return "\n".join(lines)
