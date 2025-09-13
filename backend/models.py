# models.py
from sqlalchemy import (
    Column, Integer, String, DateTime, Table, ForeignKey, Text, Float, JSON, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# --- Many-to-many: users attending events ---
event_attendees = Table(
    "event_attendees",
    Base.metadata,
    Column("event_id", ForeignKey("events.id"), primary_key=True),
    Column("user_id",  ForeignKey("users.id"),  primary_key=True),
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)

    # auth
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    # profile fields
    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    school_or_career_type = Column(String, nullable=True)

    # lists as CSV for simplicity (ok for tests)
    interests = Column(Text, nullable=True)                 # "music,ai,volunteering"
    causes_interested = Column(Text, nullable=True)         # "climate,education"

    wake_time = Column(String, nullable=True)               # "HH:MM"
    sleep_time = Column(String, nullable=True)              # "HH:MM"
    preferred_days = Column(Text, nullable=True)            # "Mon,Tue,Fri"
    personality_type = Column(String, nullable=True)
    location = Column(String, nullable=True)                # e.g., "Newark, DE"

    created_at = Column(DateTime, default=datetime.utcnow)

    attending = relationship(
        "Event",
        secondary=event_attendees,
        back_populates="attendees",
        lazy="joined",
    )

    # optional: one cached query embedding per user profile (for tests)
    query_embedding = relationship("UserQueryEmbedding", uselist=False, back_populates="user")


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)

    # Core fields
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    apply_url = Column(String, nullable=True)

    # Prefer explicit ISO fields (keep old time_iso if you like, but starts_at is clearer)
    starts_at = Column(String, nullable=False)              # ISO 8601 with tz offset
    ends_at   = Column(String, nullable=True)

    venue = Column(String, nullable=True)                   # human-readable place
    location = Column(String, nullable=False)               # city/state/country string

    # Geo for distance scoring (don’t put in embeddings)
    latitude  = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    tags       = Column(Text, nullable=True)                # "healthcare,ai,meetup"
    organizers = Column(Text, nullable=True)                # "henhacks,cssg"

    price_amount   = Column(Float, nullable=True)
    price_currency = Column(String, nullable=True, default="USD")

    people_cap = Column(Integer, nullable=True)

    # Provenance for dedupe & freshness
    source = Column(String, nullable=True)                  # "cache" | "web"
    evidence_urls = Column(JSON, nullable=True)             # ["https://…", ...]
    dedupe_id = Column(String, nullable=True, unique=True)  # hash(title+date+host)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    attendees = relationship(
        "User",
        secondary=event_attendees,
        back_populates="attending",
        lazy="joined",
    )

# Helpful indexes for filtering/sorting (SQLite supports basic indexes)
Index("ix_events_starts_at", Event.starts_at)
Index("ix_events_lat_lon", Event.latitude, Event.longitude)
Index("ix_events_source", Event.source)


# --- Embeddings tables ---
# Store vectors outside the main tables so you can re-embed with new models or dimensions.

class EventEmbedding(Base):
    __tablename__ = "event_embeddings"
    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)

    # Store vectors as bytes for tests (e.g., numpy.ndarray.tobytes()).
    # In Postgres you’d use pgvector; in SQLite you can keep bytes and search via FAISS in-memory.
    vector = Column(String, nullable=False)       # base64 string OR hex string of bytes for demo
    dim    = Column(Integer, nullable=False)

    # Metadata to track which embed model/version was used
    model_name = Column(String, nullable=False)   # e.g., "gemini-embed-text"
    task_type  = Column(String, nullable=False)   # "RETRIEVAL_DOCUMENT"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("event_id", "model_name", "task_type", name="uq_event_model_task"),
    )


class UserQueryEmbedding(Base):
    __tablename__ = "user_query_embeddings"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # Single cached query vector per user profile (for a quick test).
    # If you’ll support multiple “intents” per user, drop unique=True and add an intent key.
    vector = Column(String, nullable=False)       # base64/hex of bytes
    dim    = Column(Integer, nullable=False)

    model_name = Column(String, nullable=False)   # "gemini-embed-text"
    task_type  = Column(String, nullable=False)   # "RETRIEVAL_QUERY"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="query_embedding")
