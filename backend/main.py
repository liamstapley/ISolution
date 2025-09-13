from typing import List
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import User, Event
from schemas import UserCreate, Login, Token, UserOut, EventCreate, EventOut
from auth import hash_password, verify_password, create_access_token, get_current_user

app = FastAPI(title="ISolution API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

def _csv_to_list(s: str | None) -> List[str]:
    return [x for x in (s or "").split(",") if x]

def _list_to_csv(lst: List[str] | None) -> str | None:
    if lst is None:
        return None
    return ",".join([x.strip() for x in lst if x.strip()])

@app.get("/api/health")
def health():
    return {"status": "ok"}

# ---------- Auth ----------
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
        id=user.id,
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
    )

# ---------- Events ----------
@app.post("/api/events", response_model=EventOut)
def create_event(data: EventCreate, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ev = Event(
        title=data.title,
        time_iso=data.time_iso,
        location=data.location,
        organizers=_list_to_csv(data.organizers),
        people_cap=data.people_cap,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return EventOut(
        id=ev.id,
        title=ev.title,
        time_iso=ev.time_iso,
        location=ev.location,
        organizers=_csv_to_list(ev.organizers),
        people_cap=ev.people_cap,
        num_going=len(ev.attendees),
        usernames_going=[u.username for u in ev.attendees],
    )

@app.get("/api/events", response_model=list[EventOut])
def list_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    return [
        EventOut(
            id=e.id,
            title=e.title,
            time_iso=e.time_iso,
            location=e.location,
            organizers=_csv_to_list(e.organizers),
            people_cap=e.people_cap,
            num_going=len(e.attendees),
            usernames_going=[u.username for u in e.attendees],
        )
        for e in events
    ]

@app.post("/api/events/{event_id}/rsvp")
def rsvp(event_id: int, current: User = Depends(get_current_user), db: Session = Depends(get_db)):
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