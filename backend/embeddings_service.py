import os
import google.genai as genai
from google.genai import types
from typing import List, Sequence
from dotenv import load_dotenv

load_dotenv()
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