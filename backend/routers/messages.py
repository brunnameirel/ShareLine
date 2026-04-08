"""
Endpoints:
    GET  /messages/{request_id}      — fetch full message history
    POST /messages/{request_id}      — send a message in a thread
    WS   /messages/{request_id}/ws  — real-time WebSocket connection
"""

import os
from datetime import datetime
from typing import Dict, List, Set
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, WebSocketException, status, Query
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from jose import JWTError, jwt

from db import SessionDep, engine
from models import MessageTable, NotificationTable, RequestTable, ItemTable, UserTable
from routers.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

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
# WebSocket Auth Helper
# ---------------------------------------------------------------------------

def get_user_ws(token: str, session: Session) -> UserTable:
    """Decodes the JWT from a WebSocket query parameter."""
    try:
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=["HS256"], 
            options={"verify_aud": False}
        )
        supabase_uid = payload.get("sub")
        if supabase_uid is None:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
            
        user = session.exec(select(UserTable).where(UserTable.supabase_id == supabase_uid)).first()
        if user is None:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
            
        return user
    except JWTError:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------

class ConnectionManager:
    def __init__(self) -> None:
        self.active: Dict[UUID, Set[WebSocket]] = {}

    async def connect(self, request_id: UUID, ws: WebSocket) -> None:
        await ws.accept()
        self.active.setdefault(request_id, set()).add(ws)

    def disconnect(self, request_id: UUID, ws: WebSocket) -> None:
        if request_id in self.active:
            self.active[request_id].discard(ws)

    async def broadcast(self, request_id: UUID, data: dict) -> None:
        for ws in list(self.active.get(request_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                self.active[request_id].discard(ws)

manager = ConnectionManager()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_approved_request(
    request_id: UUID,
    current_user: UserTable,
    session: Session,
) -> RequestTable:
    """Validate that the request exists, is approved, and user is a party to it."""
    req = session.get(RequestTable, request_id)

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.status in ("Completed", "Rejected"):
        raise HTTPException(status_code=400, detail="Messaging is disabled for Completed or Rejected requests")

    if req.status != "Approved":
        raise HTTPException(status_code=400, detail=f"Messaging is only available once a request is Approved (current status: {req.status})")

    item = session.get(ItemTable, req.item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if current_user.id not in (req.requester_id, item.donor_id):
        raise HTTPException(
            status_code=403, 
            detail=f"You are not a party to this message thread. Your ID: {current_user.id}, Requester: {req.requester_id}, Donor: {item.donor_id}"
        )

    return req

def _create_notification(
    user_id: UUID,
    message: str,
    link: str,
    session: Session,
) -> None:
    """Create a notification for a user."""
    notif = NotificationTable(user_id=user_id, message=message, link=link)
    session.add(notif)

# ---------------------------------------------------------------------------
# GET /messages/{request_id}
# ---------------------------------------------------------------------------

@router.get("/{request_id}", response_model=List[MessageRead])
def get_messages(
    request_id: UUID,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
) -> List[MessageTable]:
    """Fetch full message history for a request thread"""
    _get_approved_request(request_id, current_user, session)
    
    messages = session.exec(
        select(MessageTable)
        .where(MessageTable.request_id == request_id)
        .order_by(MessageTable.created_at)
    ).all()
    
    return messages

# ---------------------------------------------------------------------------
# POST /messages/{request_id}
# ---------------------------------------------------------------------------

@router.post("/{request_id}", response_model=MessageRead, status_code=201)
async def send_message(
    request_id: UUID,
    payload: MessageCreate,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
) -> MessageTable:
    """Send a message in an approved request thread"""
    req = _get_approved_request(request_id, current_user, session)
    item = session.get(ItemTable, req.item_id)

    msg = MessageTable(
        request_id=request_id,
        sender_id=current_user.id,
        body=payload.body,
    )
    session.add(msg)

    other_user_id = item.donor_id if current_user.id == req.requester_id else req.requester_id
    preview = payload.body[:60] + "..." if len(payload.body) > 60 else payload.body

    _create_notification(
        user_id=other_user_id,
        message=f"New message: {preview}",
        link=f"/requests/{request_id}",
        session=session,
    )

    session.commit()
    session.refresh(msg)

    await manager.broadcast(
        request_id,
        {
            "id": str(msg.id),
            "request_id": str(msg.request_id),
            "sender_id": str(msg.sender_id),
            "body": msg.body,
            "created_at": msg.created_at.isoformat(),
        },
    )

    return msg

# ---------------------------------------------------------------------------
# WS /messages/{request_id}/ws
# ---------------------------------------------------------------------------

@router.websocket("/{request_id}/ws")
async def websocket_messages(
    request_id: UUID,
    ws: WebSocket,
    token: str = Query(...)
) -> None:
    """Real-time WebSocket connection for messaging"""
    # Create a session for WebSocket (can't use Depends with WebSocket)
    with Session(engine) as session:
        # Authenticate the WebSocket connection
        user = get_user_ws(token, session)

        # Validate that the user actually has access to this thread
        try:
            _get_approved_request(request_id, user, session)
        except HTTPException:
            await ws.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await manager.connect(request_id, ws)
        try:
            while True:
                await ws.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(request_id, ws)
