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
ALGORITHM = "ES256"

JWKS_URL = SUPABASE_URL

security = HTTPBearer()
router = APIRouter(prefix="/auth", tags=["auth"])


def get_public_key(token: str):
    headers = jwt.get_unverified_header(token)
    kid = headers.get("kid")

    jwks = requests.get(JWKS_URL).json()

    key = next((k for k in jwks["keys"] if k["kid"] == kid), None)

    if not key:
        raise HTTPException(status_code=401, detail="Public key not found")

    return key



def get_current_user(
    session: SessionDep,
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserTable:
    token = credentials.credentials

    try:
        key = get_public_key(token)

        payload = jwt.decode(
            token,
            key,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},
        )

        supabase_uid = payload.get("sub")

        if supabase_uid is None:
            raise HTTPException(status_code=401, detail="Invalid token")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

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

    try:
        key = get_public_key(token)

        payload = jwt.decode(
            token,
            key,
            algorithms=[ALGORITHM],
            options={"verify_aud": False},
        )

        supabase_uid = payload.get("sub")

        if supabase_uid is None:
            raise HTTPException(status_code=401, detail="Invalid token")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    new_user = UserTable(
        supabase_id=supabase_uid,
        email="",  # You can later pull this from payload if needed
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