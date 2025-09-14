# schemas.py
from __future__ import annotations
from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, field_validator, ConfigDict

# ---------- helpers ----------
def _csv_to_list(v):
    if v is None:
        return []
    if isinstance(v, list):
        return [str(x).strip() for x in v if str(x).strip()]
    if isinstance(v, str):
        return [s.strip() for s in v.split(",") if s.strip()]
    return [str(v)]

# ---------- User ----------
class UserCreate(BaseModel):
    username: str
    password: str
    name: Optional[str] = None
    age: Optional[int] = None
    school_or_career_type: Optional[str] = None

    interests: Optional[List[str]] = None
    causes_interested: Optional[List[str]] = None

    wake_time: Optional[str] = None            # "HH:MM"
    sleep_time: Optional[str] = None
    preferred_days: Optional[List[str]] = None # ["Mon","Tue",...]
    personality_type: Optional[str] = None
    location: Optional[str] = None             # e.g., "Newark, DE"

    @field_validator("interests", "causes_interested", "preferred_days", mode="before")
    @classmethod
    def _coerce_lists(cls, v):
        return _csv_to_list(v) if isinstance(v, str) else v


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    name: Optional[str] = None
    age: Optional[int] = None
    school_or_career_type: Optional[str] = None

    interests: List[str] = []
    causes_interested: List[str] = []
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    preferred_days: List[str] = []
    personality_type: Optional[str] = None
    location: Optional[str] = None
    created_at: Optional[datetime] = None

    @field_validator("interests", "causes_interested", "preferred_days", mode="before")
    @classmethod
    def _split_csv(cls, v):
        return _csv_to_list(v)


class Login(BaseModel):
    username: str
    password: str

# ---------- Token ----------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ---------- Events ----------
class EventCreate(BaseModel):
    # Core
    title: str
    description: Optional[str] = None
    apply_url: Optional[str] = None

    # Time (required)
    starts_at: str                               # ISO 8601 with tz offset, e.g. "2025-09-13T18:00:00-04:00"
    ends_at: Optional[str] = None

    # Place
    venue: Optional[str] = None
    location: str                                # city/state/country string
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # Metadata
    tags: Optional[List[str]] = None
    organizers: Optional[List[str]] = None
    price_amount: Optional[float] = None
    price_currency: Optional[str] = "USD"
    people_cap: Optional[int] = None

    # Provenance (useful for testing cache vs web)
    source: Optional[Literal["cache", "web"]] = "cache"
    evidence_urls: Optional[List[str]] = None

    @field_validator("tags", "organizers", "evidence_urls", mode="before")
    @classmethod
    def _coerce_listish(cls, v):
        return _csv_to_list(v) if isinstance(v, str) else v


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int

    # Core
    title: str
    description: Optional[str] = None
    apply_url: Optional[str] = None

    # Time
    starts_at: str
    ends_at: Optional[str] = None

    # Place
    venue: Optional[str] = None
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    # Metadata
    tags: List[str] = []
    organizers: List[str] = []
    price_amount: Optional[float] = None
    price_currency: Optional[str] = "USD"
    people_cap: Optional[int] = None

    # Provenance
    source: Optional[Literal["cache", "web"]] = None
    evidence_urls: List[str] = []
    dedupe_id: Optional[str] = None

    # Attendance summary
    num_going: int
    usernames_going: List[str]

    # Timestamps
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    score: Optional[float] = None

    @field_validator("tags", "organizers", "evidence_urls", mode="before")
    @classmethod
    def _split_csv(cls, v):
        return _csv_to_list(v)

# ---------- Embeddings (for testing) ----------
class EventEmbeddingCreate(BaseModel):
    event_id: int
    vector: List[float]                # send raw floats in tests
    dim: Optional[int] = None          # server can infer len(vector) if omitted
    model_name: str                    # e.g., "gemini-embed-text"
    task_type: Literal["RETRIEVAL_DOCUMENT"] = "RETRIEVAL_DOCUMENT"

class EventEmbeddingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    event_id: int
    dim: int
    model_name: str
    task_type: Literal["RETRIEVAL_DOCUMENT"]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserQueryEmbeddingCreate(BaseModel):
    user_id: int
    vector: List[float]
    dim: Optional[int] = None
    model_name: str
    task_type: Literal["RETRIEVAL_QUERY"] = "RETRIEVAL_QUERY"

class UserQueryEmbeddingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    dim: int
    model_name: str
    task_type: Literal["RETRIEVAL_QUERY"]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# ---- Quiz save payloads ----
from typing import Dict, Any

class QuizAnswersIn(BaseModel):
    # matches your quizPages.js ids (send any subset)
    ageRange: Optional[str] = None
    schoolStatus: Optional[str] = None
    freeTime: Optional[str] = None
    wakeTime: Optional[str] = None
    sleepTime: Optional[str] = None
    freeDays: Optional[List[str]] = None

class StringListIn(BaseModel):
    selected: List[str]