from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlmodel import select
from backend.models import UserTable
from db import SessionDep
from schemas import UserCreate, UserRead
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
ALGORITHM = "HS256"

security = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["auth"])


# Dependency: Get Current User
def get_current_user(
    session: SessionDep,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserTable:
    """Decode JWT token and return current user from database"""
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=[ALGORITHM], 
            options={"verify_aud": False}
        )
        supabase_uid = payload.get("sub")
        if supabase_uid is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Query database for user by supabase_id
    stmt = select(UserTable).where(UserTable.supabase_id == supabase_uid)
    user = session.exec(stmt).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user


# Role Checkers 
def require_donor(user: UserTable = Depends(get_current_user)) -> UserTable:
    if not user.is_donor:
        raise HTTPException(status_code=403, detail="Donor role required")
    return user


def require_requester(user: UserTable = Depends(get_current_user)) -> UserTable:
    if not user.is_requester:
        raise HTTPException(status_code=403, detail="Requester role required")
    return user


# Routes

@router.post("/profile", response_model=UserRead)
def create_profile(
    data: UserCreate,
    session: SessionDep,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """Called right after supabase.auth.signUp() on the frontend."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[ALGORITHM], options={"verify_aud": False})
        supabase_uid = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Create profile in database
    new_user = UserTable(
        supabase_id=supabase_uid,
        email="",  # Email from Supabase auth (not in request)
        is_donor=data.is_donor or False,
        is_requester=data.is_requester or False,
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    return new_user


@router.get("/me", response_model=UserRead)
def get_me(user: UserTable = Depends(get_current_user)):
    """Return the current user's profile."""
    return user