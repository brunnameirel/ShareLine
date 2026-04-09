"""
Requests router — ShareLine
Exposes approved request threads for the messages page.

Endpoints:
    GET /requests  — list requests for the current user (filterable by status)
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlmodel import select

from db import SessionDep
from models import ItemTable, RequestTable, UserTable
from routers.auth import get_current_user

router = APIRouter(prefix="/requests", tags=["requests"])


class RequestRead(BaseModel):
    id: UUID
    item_id: UUID
    item_name: str
    status: str
    other_user_id: UUID
    other_user_name: str

    class Config:
        from_attributes = True


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
