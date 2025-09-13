from pydantic import BaseModel
from typing import List, Optional

# ---------- User ----------
class UserCreate(BaseModel):
    username: str
    password: str
    name: Optional[str] = None
    age: Optional[int] = None
    school_or_career_type: Optional[str] = None
    interests: Optional[List[str]] = None
    causes_interested: Optional[List[str]] = None
    wake_time: Optional[str] = None        # "HH:MM"
    sleep_time: Optional[str] = None
    preferred_days: Optional[List[str]] = None  # ["Mon","Tue",...]
    personality_type: Optional[str] = None
    location: Optional[str] = None

class UserOut(BaseModel):
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
    class Config:
        from_attributes = True

class Login(BaseModel):
    username: str
    password: str

# ---------- Token ----------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# ---------- Events ----------
class EventCreate(BaseModel):
    title: str
    time_iso: str
    location: str
    organizers: Optional[List[str]] = None
    people_cap: Optional[int] = None

class EventOut(BaseModel):
    id: int
    title: str
    time_iso: str
    location: str
    organizers: List[str] = []
    people_cap: Optional[int] = None
    num_going: int
    usernames_going: List[str]
    class Config:
        from_attributes = True