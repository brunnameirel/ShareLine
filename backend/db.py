from collections.abc import Generator
from typing import Annotated
import os

from fastapi import Depends
from sqlmodel import SQLModel, Session, create_engine
from dotenv import load_dotenv  

# ---------------------------------------------------------------------------
# Database connection
# Supabase gives you a string like:
#   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
#
# Use the "Session mode" pooler URL (port 6543) for serverless / dev work,
# or the "Transaction mode" URL (port 5432) if you add ?pgbouncer=true.
#
# ---------------------------------------------------------------------------
load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",  
    pool_pre_ping=True,      
    pool_recycle=300,        
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

# Optional: For direct Supabase REST API access
# from supabase import create_client
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
