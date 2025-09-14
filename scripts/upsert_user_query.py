import os, json, requests
from urllib.parse import urlencode
from google import genai
from google.genai import types

try:
    from dotenv import load_dotenv
    from pathlib import Path
    load_dotenv(Path(__file__).resolve().parents[1] / "backend" / ".env")
except Exception:
    pass

BASE = os.getenv("BASE", "http://127.0.0.1:8000")
USER_ID = int(os.getenv("USER_ID", "1"))
MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")
DIM = int(os.getenv("GEMINI_EMBED_DIM", "1536"))

# 1) build a short intent string (tweak as needed)
INTENT = os.getenv("INTENT_TEXT",
    "interests: healthcare, ai, hackathons; time_window: next 30 days; "
    "location: Newark DE (~50km); prefer free evening events"
)

# 2) embed with RETRIEVAL_QUERY
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
cfg = types.EmbedContentConfig(task_type="RETRIEVAL_QUERY", output_dimensionality=DIM or None)
res = client.models.embed_content(model=MODEL, contents=INTENT, config=cfg)
vec = res.embeddings[0].values

# 3) POST to your API to save it
payload = {
    "user_id": USER_ID,
    "vector": vec,
    "model_name": MODEL,
    "task_type": "RETRIEVAL_QUERY"
}
r = requests.post(f"{BASE}/api/embeddings/user", json=payload, timeout=20)
r.raise_for_status()
print("Upserted user query embedding:", r.json())
