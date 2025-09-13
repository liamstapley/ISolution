from sqlalchemy import (
    Column, Integer, String, DateTime, Table, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# Many-to-many: users attending events
event_attendees = Table(
    "event_attendees",
    Base.metadata,
    Column("event_id", ForeignKey("events.id"), primary_key=True),
    Column("user_id", ForeignKey("users.id"), primary_key=True),
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

    # store lists as comma-separated strings for SQLite simplicity
    interests = Column(Text, nullable=True)                 # e.g. "music,ai,volunteering"
    causes_interested = Column(Text, nullable=True)         # e.g. "climate,education"

    wake_time = Column(String, nullable=True)               # "HH:MM"
    sleep_time = Column(String, nullable=True)              # "HH:MM"
    preferred_days = Column(Text, nullable=True)            # e.g. "Mon,Tue,Fri"
    personality_type = Column(String, nullable=True)        # optional
    location = Column(String, nullable=True)                # optional, by permission

    created_at = Column(DateTime, default=datetime.utcnow)

    attending = relationship(
        "Event",
        secondary=event_attendees,
        back_populates="attendees",
        lazy="joined",
    )

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)
    time_iso = Column(String, nullable=False)               # ISO datetime string
    location = Column(String, nullable=False)
    organizers = Column(Text, nullable=True)                # e.g. "henhacks,cssg"
    people_cap = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    attendees = relationship(
        "User",
        secondary=event_attendees,
        back_populates="attending",
        lazy="joined",
    )