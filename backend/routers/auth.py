from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlmodel import select
from models import UserTable
from db import SessionDep
from schemas import UserCreate, UserRead
import os
from dotenv import load_dotenv
import requests

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
# might change later
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
# might change later
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

security = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["auth"])


# might change later
def decode_token(token: str) -> dict:
    """Try ES256 via JWKS first (user access tokens), fall back to HS256 legacy secret (Google OAuth tokens)."""
    # Try ES256 via JWKS
    try:
        headers = jwt.get_unverified_header(token)
        kid = headers.get("kid")
        print(f"[DEBUG] token header: {headers}")
        jwks = requests.get(JWKS_URL).json()
        key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
        print(f"[DEBUG] ES256 key found: {key is not None}")
        if key:
            payload = jwt.decode(token, key, algorithms=["ES256"], options={"verify_aud": False})
            print(f"[DEBUG] ES256 decode success")
            return payload
    except Exception as e:
        print(f"[DEBUG] ES256 failed: {e}")

    # might change later
    # Fall back to HS256 legacy secret (used by Google OAuth flow)
    try:
        if not SUPABASE_JWT_SECRET:
            raise ValueError("SUPABASE_JWT_SECRET not set")
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        print(f"[DEBUG] HS256 decode success")
        return payload
    except Exception as e:
        print(f"[DEBUG] HS256 failed: {e}")

    raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(
    session: SessionDep,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserTable:
    token = credentials.credentials

    payload = decode_token(token)
    supabase_uid = payload.get("sub")

    if supabase_uid is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    stmt = select(UserTable).where(UserTable.supabase_id == supabase_uid)
    user = session.exec(stmt).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


def require_donor(user: UserTable = Depends(get_current_user)) -> UserTable:
    if not user.is_donor:
        raise HTTPException(status_code=403, detail="Donor role required")
    return user


def require_requester(user: UserTable = Depends(get_current_user)) -> UserTable:
    if not user.is_requester:
        raise HTTPException(status_code=403, detail="Requester role required")
    return user


@router.post("/profile", response_model=UserRead)
def create_profile(
    data: UserCreate,
    session: SessionDep,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials

    payload = decode_token(token)
    supabase_uid = payload.get("sub")

    if supabase_uid is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    new_user = UserTable(
        supabase_id=supabase_uid,
        # might change later
        email=payload.get("email", ""),
        # might change later
        name=data.name,
        is_donor=data.is_donor or False,
        is_requester=data.is_requester or False,
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return new_user


# 👤 Get Current User
@router.get("/me", response_model=UserRead)
def get_me(user: UserTable = Depends(get_current_user)):
    return user
