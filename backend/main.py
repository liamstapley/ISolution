# main.py
from __future__ import annotations

from contextlib import asynccontextmanager
import json
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from db.database import Base, engine, get_db
from db.models import User, Event, EventEmbedding, UserQueryEmbedding
from schemas import (
    UserCreate, Login, Token, UserOut,
    EventCreate, EventOut,
    EventEmbeddingCreate, EventEmbeddingOut,
    UserQueryEmbeddingCreate, UserQueryEmbeddingOut, QuizAnswersIn, StringListIn
)
from auth import hash_password, verify_password, create_access_token, get_current_user
from embeddings_service import embed_document, event_text
import os
from ann_index import add_or_update as ann_add_or_update, rebuild as ann_rebuild, search as ann_search

@asynccontextmanager
async def lifespan(app: FastAPI):
    from db import models
    print("Application startup.")
    Base.metadata.create_all(bind=engine)
    yield
    print("Shutting down database.")

app = FastAPI(title="ISolution API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# helpers: CSV <-> list
# ---------------------------
def _csv_to_list(s: Optional[str]) -> List[str]:
    return [x.strip() for x in (s or "").split(",") if x and x.strip()]

def _list_to_csv(lst: Optional[List[str]]) -> Optional[str]:
    if lst is None:
        return None
    return ",".join([x.strip() for x in lst if str(x).strip()])

# ---------------------------
# health
# ---------------------------
@app.get("/api/health")
def health():
    return {"status": "ok"}


# ---------------------------
# auth
# ---------------------------
@app.post("/api/auth/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        name=payload.name,
        age=payload.age,
        school_or_career_type=payload.school_or_career_type,
        interests=_list_to_csv(payload.interests),
        causes_interested=_list_to_csv(payload.causes_interested),
        wake_time=payload.wake_time,
        sleep_time=payload.sleep_time,
        preferred_days=_list_to_csv(payload.preferred_days),
        personality_type=payload.personality_type,
        location=payload.location,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserOut(
        id=getattr(user, "id"),
        username=user.username,
        name=user.name,
        age=user.age,
        school_or_career_type=user.school_or_career_type,
        interests=_csv_to_list(user.interests),
        causes_interested=_csv_to_list(user.causes_interested),
        wake_time=user.wake_time,
        sleep_time=user.sleep_time,
        preferred_days=_csv_to_list(user.preferred_days),
        personality_type=user.personality_type,
        location=user.location,
        created_at=user.created_at,
    )

@app.post("/api/auth/login", response_model=Token)
def login(payload: Login, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.username)
    return {"access_token": token, "token_type": "bearer"}

@app.get("/api/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    return UserOut(
        id=current.id,
        username=current.username,
        name=current.name,
        age=current.age,
        school_or_career_type=current.school_or_career_type,
        interests=_csv_to_list(current.interests),
        causes_interested=_csv_to_list(current.causes_interested),
        wake_time=current.wake_time,
        sleep_time=current.sleep_time,
        preferred_days=_csv_to_list(current.preferred_days),
        personality_type=current.personality_type,
        location=current.location,
        created_at=current.created_at,
    )


# ---------------------------
# events
# ---------------------------
@app.post("/api/events", response_model=EventOut)
def create_event(
    data: EventCreate,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ev = Event(
        title=data.title,
        description=data.description,
        src_url=data.src_url,
        starts_at=data.starts_at,
        ends_at=data.ends_at,
        venue=data.venue,
        location=data.location,
        latitude=data.latitude,
        longitude=data.longitude,
        tags=_list_to_csv(data.tags),
        organizers=_list_to_csv(data.organizers),
        price_amount=data.price_amount,
        price_currency=data.price_currency,
        people_cap=data.people_cap,
        source=data.source,
        evidence_urls=data.evidence_urls or [],
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    try:
        text = event_text(
            ev.title,
            ev.tags or "",
            ev.organizers or "",
            ev.starts_at,
            ev.location,
            ev.description or "",
        )
        vec = embed_document(text)
        ee = EventEmbedding(
            event_id=ev.id,
            vector=json.dumps(vec),
            dim=len(vec),
            model_name=os.getenv("GEMINI_EMBED_MODEL"),
            task_type="RETRIEVAL_DOCUMENT",
        )
        db.add(ee)
        db.commit()
    except Exception as ex:
        print("auto-embed event failed:", ex)

    return EventOut(
        id=ev.id,
        title=ev.title,
        description=ev.description,
        src_url=ev.src_url,
        starts_at=ev.starts_at,
        ends_at=ev.ends_at,
        venue=ev.venue,
        location=ev.location,
        latitude=ev.latitude,
        longitude=ev.longitude,
        tags=_csv_to_list(ev.tags),
        organizers=_csv_to_list(ev.organizers),
        price_amount=ev.price_amount,
        price_currency=ev.price_currency,
        people_cap=ev.people_cap,
        source=ev.source,
        evidence_urls=ev.evidence_urls or [],
        dedupe_id=ev.dedupe_id,
        num_going=len(ev.attendees),
        usernames_going=[u.username for u in ev.attendees],
        created_at=ev.created_at,
        updated_at=ev.updated_at,
    )

@app.get("/api/events", response_model=List[EventOut])
def list_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    out: List[EventOut] = []
    for e in events:
        out.append(EventOut(
            id=e.id,
            title=e.title,
            description=e.description,
            src_url=e.src_url,
            starts_at=e.starts_at,
            ends_at=e.ends_at,
            venue=e.venue,
            location=e.location,
            latitude=e.latitude,
            longitude=e.longitude,
            tags=_csv_to_list(e.tags),
            organizers=_csv_to_list(e.organizers),
            price_amount=e.price_amount,
            price_currency=e.price_currency,
            people_cap=e.people_cap,
            source=e.source,
            evidence_urls=e.evidence_urls or [],
            dedupe_id=e.dedupe_id,
            num_going=len(e.attendees),
            usernames_going=[u.username for u in e.attendees],
            created_at=e.created_at,
            updated_at=e.updated_at,
        ))
    return out

@app.post("/api/events/{event_id}/rsvp")
def rsvp(
    event_id: int,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ev = db.query(Event).filter(Event.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    if current in ev.attendees:
        return {"ok": True, "already": True, "event_id": event_id}
    if ev.people_cap is not None and len(ev.attendees) >= ev.people_cap:
        raise HTTPException(status_code=400, detail="Event is full")

    ev.attendees.append(current)
    db.commit()
    return {"ok": True, "event_id": event_id}

# ---------------------------
# embeddings (simple test endpoints)
# These let you POST raw float vectors and store them.
# In production you'd generate via Gemini Embeddings API on the server.
# ---------------------------
def _encode_vec(vec: List[float]) -> str:
    # store as JSON string for simplicity (works fine in SQLite)
    return json.dumps(vec)

def _decode_vec(s: str) -> List[float]:
    return json.loads(s)

def _cosine(a: List[float], b: List[float]) -> float:
    # Using the cos dot product formula to compare similarity of the vectors
    # based on theta
    if not a or not b or len(a) != len(b):
        return 0.0
    import math
    dot = sum(x*y for x, y in zip(a, b))
    na = math.sqrt(sum(x*x for x in a))
    nb = math.sqrt(sum(y*y for y in b))
    return dot / (na * nb) if na and nb else 0.0

@app.post("/api/embeddings/events", response_model=EventEmbeddingOut)
def create_event_embedding(payload: EventEmbeddingCreate, db: Session = Depends(get_db)):
    ev = db.query(Event).filter(Event.id == payload.event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    dim = payload.dim or len(payload.vector)
    if dim != len(payload.vector):
        raise HTTPException(status_code=400, detail="dim does not match vector length")

    existing = (
        db.query(EventEmbedding)
        .filter(
            EventEmbedding.event_id == payload.event_id,
            EventEmbedding.model_name == payload.model_name,
            EventEmbedding.task_type == payload.task_type,
        )
        .first()
    )
    if existing:
        # update
        existing.vector = _encode_vec(payload.vector)
        existing.dim = dim
        db.commit()
        db.refresh(existing)
        return existing

    ee = EventEmbedding(
        event_id=payload.event_id,
        vector=_encode_vec(payload.vector),
        dim=dim,
        model_name=payload.model_name,
        task_type=payload.task_type,
    )
    db.add(ee)
    db.commit()
    db.refresh(ee)
    # Build the index key from the embedding’s meta:
    key = (ee.model_name, ee.task_type, ee.dim)

    # Upsert this single vector into ANN with label = event_id
    ann_add_or_update(
        key=key,
        dim=ee.dim,
        embeddings=[(ee.event_id, _decode_vec(ee.vector))],)
    return ee

@app.post("/api/embeddings/user", response_model=UserQueryEmbeddingOut)
def upsert_user_query_embedding(payload: UserQueryEmbeddingCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    dim = payload.dim or len(payload.vector)
    if dim != len(payload.vector):
        raise HTTPException(status_code=400, detail="dim does not match vector length")

    existing = db.query(UserQueryEmbedding).filter(UserQueryEmbedding.user_id == payload.user_id).first()
    if existing:
        existing.vector = _encode_vec(payload.vector)
        existing.dim = dim
        existing.model_name = payload.model_name
        existing.task_type = payload.task_type
        db.commit()
        db.refresh(existing)
        return existing

    ue = UserQueryEmbedding(
        user_id=payload.user_id,
        vector=_encode_vec(payload.vector),
        dim=dim,
        model_name=payload.model_name,
        task_type=payload.task_type,
    )
    db.add(ue)
    db.commit()
    db.refresh(ue)
    return ue


# ---------------------------
# test recommendations (cosine over stored vectors)
# This is purely for local testing without FAISS/pgvector.
# ---------------------------
@app.get("/api/recommendations/test", response_model=List[EventOut])
def test_recommendations(
    user_id: int = Query(...),
    top_k: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    uq = db.query(UserQueryEmbedding).filter(UserQueryEmbedding.user_id == user_id).first()
    if not uq:
        raise HTTPException(status_code=404, detail="No user query embedding. POST /api/embeddings/user first.")

    qvec = _decode_vec(uq.vector)
    dim = uq.dim

    # load event embeddings with the same model/task/dim (simple filter)
    eembs = (
        db.query(EventEmbedding)
        .filter(
            EventEmbedding.dim == dim,
            EventEmbedding.model_name == uq.model_name,
            EventEmbedding.task_type == "RETRIEVAL_DOCUMENT",
        )
        .all()
    )
    if not eembs:
        return []

    # score by cosine
    scored: list[tuple[float, Event]] = []
    for ee in eembs:
        ev = db.query(Event).filter(Event.id == ee.event_id).first()
        if not ev:
            continue
        score = _cosine(qvec, _decode_vec(ee.vector))
        scored.append((score, ev))

    # sort and take top_k
    scored.sort(key=lambda t: t[0], reverse=True)
    top = scored[:top_k]

    # Map to EventOut (you can also include the score in a debug field if you like)
    results: List[EventOut] = []
    for score, e in top:
        results.append(EventOut(
            id=e.id,
            title=e.title,
            description=e.description,
            src_url=e.src_url,
            starts_at=e.starts_at,
            ends_at=e.ends_at,
            venue=e.venue,
            location=e.location,
            latitude=e.latitude,
            longitude=e.longitude,
            tags=_csv_to_list(e.tags),
            organizers=_csv_to_list(e.organizers),
            price_amount=e.price_amount,
            price_currency=e.price_currency,
            people_cap=e.people_cap,
            source=e.source,
            evidence_urls=e.evidence_urls or [],
            dedupe_id=e.dedupe_id,
            num_going=len(e.attendees),
            usernames_going=[u.username for u in e.attendees],
            created_at=e.created_at,
            updated_at=e.updated_at,
        ))
    return results

@app.get("/api/recommendations/ann", response_model=List[EventOut])
def ann_recommendations(
    user_id: int = Query(...),
    top_k: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
):
    # 1) Load the user query vector
    uq = db.query(UserQueryEmbedding).filter(UserQueryEmbedding.user_id == user_id).first()
    if not uq:
        raise HTTPException(status_code=404, detail="No user query embedding. POST /api/embeddings/user first.")
    qvec = _decode_vec(uq.vector)

    # 2) Search ANN with the same model/task/dim
    key = (uq.model_name, "RETRIEVAL_DOCUMENT", uq.dim)
    hits = ann_search(key=key, dim=uq.dim, query_vec=qvec, k=top_k)

    if not hits:
        return []

    # 3) Fetch the corresponding events in hit order
    event_ids = [lab for (lab, dist) in hits]
    # Build a mapping id->rank to preserve ANN order
    rank = {eid: i for i, eid in enumerate(event_ids)}
    # Distance map for raw cosine-based similarity (0..2 -> 1..0)
    dist_map = {lab: float(dist) for (lab, dist) in hits}

    events = db.query(Event).filter(Event.id.in_(event_ids)).all()
    events.sort(key=lambda e: rank.get(e.id, 1_000_000))

    # Attach a raw similarity score in [0,1] via 1 - (d/2), no batch normalization
    results = []
    for e in events:
        _d = dist_map.get(e.id, 2.0)
        _sim = 1.0 - (_d / 2.0)            # map [0,2] distance -> [1,0] similarity
        _sim = max(0.0, min(1.0, _sim))    # clamp just in case
        results.append(EventOut(
            id=e.id,
            title=e.title,
            description=e.description,
            src_url=e.src_url,
            starts_at=e.starts_at,
            ends_at=e.ends_at,
            location=e.location,
            tags=_csv_to_list(e.tags),
            organizers=_csv_to_list(e.organizers),
            price_amount=e.price_amount,
            price_currency=e.price_currency,
            people_cap=e.people_cap,
            source=e.source,
            evidence_urls=e.evidence_urls or [],
            dedupe_id=e.dedupe_id,
            num_going=len(e.attendees),
            usernames_going=[u.username for u in e.attendees],
            created_at=e.created_at,
            updated_at=e.updated_at,
            score=round(float(_sim), 6),
        ))
    return results



@app.post("/api/ann/rebuild")
def rebuild_ann_index(
    model_name: str = Query(...),
    task_type: str = Query("RETRIEVAL_DOCUMENT"),
    dim: int = Query(..., ge=1),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(EventEmbedding)
        .filter(
            EventEmbedding.model_name == model_name,
            EventEmbedding.task_type == task_type,
            EventEmbedding.dim == dim
        )
        .all()
    )
    items = []
    for r in rows:
        items.append((r.event_id, _decode_vec(r.vector)))

    key = (model_name, task_type, dim)
    count = ann_rebuild(key=key, dim=dim, all_items=items)
    return {"ok": True, "count": count}

@app.post("/api/profile/quiz")
def save_quiz_answers(
    payload: QuizAnswersIn,
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Map quiz answers -> user profile fields
    if payload.schoolStatus:
        current.school_or_career_type = payload.schoolStatus
    if payload.wakeTime:
        current.wake_time = payload.wakeTime
    if payload.sleepTime:
        current.sleep_time = payload.sleepTime
    if payload.freeDays is not None:
        current.preferred_days = _list_to_csv(payload.freeDays)

    db.add(current)
    db.commit()
    db.refresh(current)
    return {"ok": True}

@app.post("/api/profile/personality")
def set_personality(
    payload: StringListIn,   # expects {"selected": ["Question: Answer", ...]} OR just ["..."]
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # If frontend sends ["Q: A", "Q2: A2", ...], join to one string for storage
    current.personality_type = ",".join(payload.selected) if payload.selected else None
    db.add(current)
    db.commit()
    return {"ok": True}

@app.post("/api/profile/interests")
def set_interests(
    payload: StringListIn,   # {"selected": ["Music", "Coding", "Traveling"]}
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current.interests = _list_to_csv(payload.selected)
    db.add(current)
    db.commit()
    return {"ok": True}

@app.post("/api/profile/causes")
def set_causes(
    payload: StringListIn,   # {"selected": ["Climate Action", "Education Equity", "AI Safety"]}
    current: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current.causes_interested = _list_to_csv(payload.selected)
    db.add(current)
    db.commit()
    return {"ok": True}

@app.post("/api/profile/location")
def set_location(payload: dict, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current.location = (payload.get("location") or "").strip() or None
    db.add(current); db.commit()
    return {"ok": True}