from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlmodel import Session, select
from models import User
from schemas import UserCreate, UserRead
from db import get_session
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM = "HS256"

security = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["auth"])

router = APIRouter(prefix="/auth", tags=["auth"])
# Dependency: Get Current User

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[ALGORITHM], audience="authenticated")
        supabase_uid = payload.get("sub")
        if supabase_uid is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Look up user in your profiles table by Supabase auth uid
    user = session.exec(select(User).where(User.supabase_id == supabase_uid)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User profile not found")
    return user


# Role Checkers 

def require_donor(user: User = Depends(get_current_user)) -> User:
    if not user.is_donor:
        raise HTTPException(status_code=403, detail="Donor role required")
    return user


def require_requester(user: User = Depends(get_current_user)) -> User:
    if not user.is_requester:
        raise HTTPException(status_code=403, detail="Requester role required")
    return user


# routes

@router.post("/profile", response_model=UserRead)
def create_profile(
    data: UserCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
):
    """Called right after supabase.auth.signUp() on the frontend."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[ALGORITHM], audience="authenticated")
        supabase_uid = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    existing = session.exec(select(User).where(User.supabase_id == supabase_uid)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists")

    new_user = User(
        supabase_id=supabase_uid,
        email=data.email,
        name=data.name,
        is_donor=data.is_donor,
        is_requester=data.is_requester,
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user


@router.get("/me", response_model=UserRead)
def get_me(user: User = Depends(get_current_user)):
    """Return the current user's profile."""
    return user