"""
Requests router — ShareLine
Exposes approved request threads for the messages page.

Endpoints:
    GET /requests  — list requests for the current user (filterable by status)
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlmodel import select

from db import SessionDep
from models import ItemTable, MessageTable, RequestTable, UserTable
from routers.auth import get_current_user

router = APIRouter(prefix="/requests", tags=["requests"])


class RequestCreate(BaseModel):
    item_id: UUID
    requested_quantity: int = Field(..., ge=1)


class RequestSimpleRead(BaseModel):
    id: UUID
    item_id: UUID
    status: str

    class Config:
        from_attributes = True


class RequestRead(BaseModel):
    id: UUID
    item_id: UUID
    item_name: str
    status: str
    other_user_id: UUID
    other_user_name: str

    class Config:
        from_attributes = True


@router.post("", response_model=RequestSimpleRead, status_code=201)
def create_request(
    session: SessionDep,
    payload: RequestCreate,
    current_user: UserTable = Depends(get_current_user),
):
    item = session.get(ItemTable, payload.item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    if item.status != "Available":
        raise HTTPException(400, "Item is no longer available")
    if item.donor_id == current_user.id:
        raise HTTPException(400, "You cannot request your own item")
    if payload.requested_quantity > item.quantity:
        raise HTTPException(400, f"Only {item.quantity} available")

    # Prevent duplicate pending requests
    existing = session.exec(
        select(RequestTable)
        .where(RequestTable.item_id == payload.item_id)
        .where(RequestTable.requester_id == current_user.id)
        .where(RequestTable.status == "Pending")
    ).first()
    if existing:
        raise HTTPException(400, "You already have a pending request for this item")

    req = RequestTable(
        requester_id=current_user.id,
        item_id=payload.item_id,
        requested_quantity=payload.requested_quantity,
    )
    session.add(req)
    session.commit()
    session.refresh(req)
    return req


class RequestUpdate(BaseModel):
    status: str  # Approved | Rejected


@router.patch("/{request_id}", response_model=RequestSimpleRead)
def update_request(
    request_id: UUID,
    payload: RequestUpdate,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
):
    if payload.status not in ("Approved", "Rejected"):
        raise HTTPException(400, "status must be Approved or Rejected")

    req = session.get(RequestTable, request_id)
    if not req:
        raise HTTPException(404, "Request not found")

    item = session.get(ItemTable, req.item_id)
    if not item:
        raise HTTPException(404, "Item not found")

    if item.donor_id != current_user.id:
        raise HTTPException(403, "Only the donor can approve or reject requests")

    req.status = payload.status
    session.add(req)

    if payload.status == "Approved":
        # Mark item as Reserved
        item.status = "Reserved"
        session.add(item)
        # Reject all other pending requests for this item
        others = session.exec(
            select(RequestTable)
            .where(RequestTable.item_id == item.id)
            .where(RequestTable.id != request_id)
            .where(RequestTable.status == "Pending")
        ).all()
        for other in others:
            other.status = "Rejected"
            session.add(other)

    session.commit()
    session.refresh(req)
    return req


@router.get("", response_model=List[RequestRead])
def list_requests(
    session: SessionDep,
    status: Optional[str] = Query(None),
    current_user: UserTable = Depends(get_current_user),
):
    """
    Return all requests where the current user is either the requester or the donor.
    Optionally filter by status (e.g. ?status=Approved).
    """
    # Requests where I'm the requester
    stmt = select(RequestTable).where(
        RequestTable.requester_id == current_user.id
    )
    if status:
        stmt = stmt.where(RequestTable.status == status)
    as_requester = session.exec(stmt).all()

    # Requests where I'm the donor (via item)
    donor_items = session.exec(
        select(ItemTable).where(ItemTable.donor_id == current_user.id)
    ).all()
    donor_item_ids = [item.id for item in donor_items]

    as_donor = []
    if donor_item_ids:
        stmt2 = select(RequestTable).where(
            RequestTable.item_id.in_(donor_item_ids)
        )
        if status:
            stmt2 = stmt2.where(RequestTable.status == status)
        as_donor = session.exec(stmt2).all()

    # Merge, deduplicate
    seen = set()
    all_requests = []
    for req in list(as_requester) + list(as_donor):
        if req.id not in seen:
            seen.add(req.id)
            all_requests.append(req)

    results = []
    for req in all_requests:
        item = session.get(ItemTable, req.item_id)
        if not item:
            continue

        # Determine the other party
        if current_user.id == req.requester_id:
            other_user_id = item.donor_id
        else:
            other_user_id = req.requester_id

        other_user = session.get(UserTable, other_user_id)
        other_user_name = other_user.name if other_user else "User"

        results.append(
            RequestRead(
                id=req.id,
                item_id=req.item_id,
                item_name=item.name,
                status=req.status,
                other_user_id=other_user_id,
                other_user_name=other_user_name,
            )
        )

    return results


@router.post("/{request_id}/complete", response_model=RequestSimpleRead)
def complete_request(
    request_id: UUID,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
):
    """Mark a request as Completed, delete its messages, and mark the item as Donated."""
    req = session.get(RequestTable, request_id)
    if not req:
        raise HTTPException(404, "Request not found")
    if req.status != "Approved":
        raise HTTPException(400, f"Only Approved requests can be completed (current: {req.status})")

    item = session.get(ItemTable, req.item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    if current_user.id not in (req.requester_id, item.donor_id):
        raise HTTPException(403, "You are not a party to this request")

    req.status = "Completed"
    session.add(req)

    item.status = "Donated"
    session.add(item)

    messages = session.exec(
        select(MessageTable).where(MessageTable.request_id == request_id)
    ).all()
    for msg in messages:
        session.delete(msg)

    session.commit()
    session.refresh(req)
    return req
