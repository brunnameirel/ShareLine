"""
Messages router — ShareLine
Realtime delivery is handled by Supabase broadcast trigger (no WebSockets).

Endpoints:
    GET  /messages/{request_id}  — fetch full message history
    POST /messages/{request_id}  — send a message in a thread
"""

from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from db import SessionDep
from models import MessageTable, NotificationTable, RequestTable, ItemTable, UserTable
from routers.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class MessageCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=1000)


class MessageRead(BaseModel):
    id: UUID
    request_id: UUID
    sender_id: UUID
    body: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_approved_request(
    request_id: UUID,
    current_user: UserTable,
    session: Session,
) -> RequestTable:
    """Validate the request exists, is approved, and user is a party to it."""
    req = session.get(RequestTable, request_id)

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status in ("Completed", "Rejected"):
        raise HTTPException(
            status_code=400,
            detail="Messaging is disabled for Completed or Rejected requests",
        )

    if req.status != "Approved":
        raise HTTPException(
            status_code=400,
            detail=f"Messaging is only available once a request is Approved (current status: {req.status})",
        )

    item = session.get(ItemTable, req.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if current_user.id not in (req.requester_id, item.donor_id):
        raise HTTPException(
            status_code=403,
            detail="You are not a party to this message thread.",
        )

    return req


def _create_notification(
    user_id: UUID,
    message: str,
    link: str,
    session: Session,
) -> None:
    notif = NotificationTable(user_id=user_id, message=message, link=link)
    session.add(notif)


# ---------------------------------------------------------------------------
# GET /messages/{request_id}  — fetch history
# ---------------------------------------------------------------------------

@router.get("/{request_id}", response_model=List[MessageRead])
def get_messages(
    request_id: UUID,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
) -> List[MessageTable]:
    """Fetch full message history for a request thread."""
    _get_approved_request(request_id, current_user, session)

    messages = session.exec(
        select(MessageTable)
        .where(MessageTable.request_id == request_id)
        .order_by(MessageTable.created_at)
    ).all()

    return messages


# ---------------------------------------------------------------------------
# POST /messages/{request_id}  — send a message
# ---------------------------------------------------------------------------

@router.post("/{request_id}", response_model=MessageRead, status_code=201)
def send_message(
    request_id: UUID,
    payload: MessageCreate,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
) -> MessageTable:
    """
    Send a message in an approved request thread.
    Supabase Realtime broadcast trigger handles delivery to other clients.
    """
    req = _get_approved_request(request_id, current_user, session)
    item = session.get(ItemTable, req.item_id)

    msg = MessageTable(
        request_id=request_id,
        sender_id=current_user.id,
        body=payload.body,
    )
    session.add(msg)

    # Notify the other party
    other_user_id = (
        item.donor_id if current_user.id == req.requester_id else req.requester_id
    )
    preview = payload.body[:60] + "..." if len(payload.body) > 60 else payload.body
    _create_notification(
        user_id=other_user_id,
        message=f"New message: {preview}",
        link=f"/messages/{request_id}",
        session=session,
    )

    session.commit()
    session.refresh(msg)

    # No manual broadcast — Supabase trigger handles it automatically on INSERT
    return msg