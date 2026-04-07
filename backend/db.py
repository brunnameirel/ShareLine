from collections.abc import Generator
from typing import Annotated
import os

from fastapi import Depends
from sqlmodel import SQLModel, Session, create_engine

# ---------------------------------------------------------------------------
# Database connection
# Supabase gives you a string like:
#   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
#
# Use the "Session mode" pooler URL (port 6543) for serverless / dev work,
# or the "Transaction mode" URL (port 5432) if you add ?pgbouncer=true.
#
# ---------------------------------------------------------------------------
DATABASE_URL: str = os.getenv(
    "DATABASE_URL"
)
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",  # set SQL_ECHO=true to debug
    pool_pre_ping=True,      # detect stale connections (important for Supabase pooler)
    pool_recycle=300,        # recycle connections every 5 min (Supabase closes idle ones)
)


def create_db_and_tables() -> None:
    """Create all tables that don't already exist.

    Call this once on startup (see main.py lifespan hook).
    """
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Yield a SQLModel Session for use as a FastAPI dependency."""
    with Session(engine) as session:
        yield session


# Convenient type alias — use this in router function signatures:
#   def my_route(session: SessionDep): ...
SessionDep = Annotated[Session, Depends(get_session)]
