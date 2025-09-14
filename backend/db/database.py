import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

BACKEND_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB = BACKEND_DIR / "data" / "app.db"
DEFAULT_DB.parent.mkdir(parents=True, exist_ok=True)

def normalize_sqlite_url(url: str) -> str:
    if not url.startswith("sqlite"):
        return url
    # Extract path after sqlite:///
    raw = url.split("sqlite:///", 1)[-1]
    p = Path(raw)
    if not p.is_absolute():
        p = (BACKEND_DIR / p).resolve()
    p.parent.mkdir(parents=True, exist_ok=True)
    return f"sqlite:///{p.as_posix()}"

DATABASE_URL = f"sqlite:///{DEFAULT_DB.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()