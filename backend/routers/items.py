"""
Items router — ShareLine

Endpoints:
    GET  /items              — list available items (browse)
    POST /items              — create a new item listing
    GET  /items/{item_id}    — fetch a single item
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlmodel import select

from db import SessionDep
from models import ItemTable, UserTable
from routers.auth import get_current_user

router = APIRouter(prefix="/items", tags=["items"])

VALID_CATEGORIES = {"Clothing", "Textbooks", "Electronics", "Bedding", "Other"}
VALID_CONDITIONS = {"New", "Like New", "Good", "Fair"}


class ItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str
    description: str = Field(..., min_length=1, max_length=500)
    condition: str
    quantity: int = Field(..., ge=1, le=99)
    location: str = Field(..., min_length=1, max_length=200)
    photo_urls: Optional[str] = None


class ItemRead(BaseModel):
    id: UUID
    donor_id: UUID
    name: str
    category: str
    description: str
    condition: str
    quantity: int
    location: str
    status: str
    photo_urls: Optional[str] = None

    class Config:
        from_attributes = True


class ItemListRead(ItemRead):
    donor_name: str


@router.get("", response_model=List[ItemListRead])
def list_items(
    session: SessionDep,
    category: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: UserTable = Depends(get_current_user),
):
    """List all available items, excluding the current user's own listings."""
    stmt = select(ItemTable).where(ItemTable.status == "Available")
    if category:
        stmt = stmt.where(ItemTable.category == category)
    if condition:
        stmt = stmt.where(ItemTable.condition == condition)

    items = session.exec(stmt).all()

    results = []
    for item in items:
        if search and search.lower() not in item.name.lower() and search.lower() not in item.description.lower():
            continue
        donor = session.get(UserTable, item.donor_id)
        results.append(ItemListRead(
            **item.model_dump(),
            donor_name=donor.name if donor else "Anonymous",
        ))

    return results


@router.post("", response_model=ItemRead, status_code=201)
def create_item(
    session: SessionDep,
    payload: ItemCreate,
    current_user: UserTable = Depends(get_current_user),
):
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(400, f"Invalid category. Choose from: {', '.join(VALID_CATEGORIES)}")
    if payload.condition not in VALID_CONDITIONS:
        raise HTTPException(400, f"Invalid condition. Choose from: {', '.join(VALID_CONDITIONS)}")

    item = ItemTable(
        donor_id=current_user.id,
        name=payload.name,
        category=payload.category,
        description=payload.description,
        condition=payload.condition,
        quantity=payload.quantity,
        location=payload.location,
        photo_urls=payload.photo_urls, 
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


class RequestOnItem(BaseModel):
    id: UUID
    requester_id: UUID
    requester_name: str
    requested_quantity: int
    status: str


class ItemWithRequests(ItemRead):
    donor_name: str
    requests: List[RequestOnItem]


@router.get("/mine", response_model=List[ItemWithRequests])
def get_my_items(
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
):
    """Return all items listed by the current user, with their requests."""
    from models import RequestTable
    items = session.exec(
        select(ItemTable).where(ItemTable.donor_id == current_user.id)
    ).all()

    results = []
    for item in items:
        reqs = session.exec(
            select(RequestTable).where(RequestTable.item_id == item.id)
        ).all()
        enriched_reqs = []
        for req in reqs:
            requester = session.get(UserTable, req.requester_id)
            enriched_reqs.append(RequestOnItem(
                id=req.id,
                requester_id=req.requester_id,
                requester_name=requester.name if requester else "User",
                requested_quantity=req.requested_quantity,
                status=req.status,
            ))
        results.append(ItemWithRequests(
            **item.model_dump(),
            donor_name=current_user.name,
            requests=enriched_reqs,
        ))
    return results


@router.get("/{item_id}", response_model=ItemRead)
def get_item(
    item_id: UUID,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
):
    item = session.get(ItemTable, item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    return item
