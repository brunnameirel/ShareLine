"""
 Real-Time Notifications

Endpoints:
    GET   /notifications            — fetch all notifications for current user
    PATCH /notifications/{id}/read  — mark one notification as read
    PATCH /notifications/read-all   — mark all notifications as read
    WS    /notifications/ws         — real-time push connection
"""

import os
from datetime import datetime
from typing import Dict, List, Set
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, WebSocketException, status, Query
from pydantic import BaseModel
from sqlmodel import Session, select
from jose import JWTError, jwt

from db import get_session, SessionDep
from models import Notification, User
from routers.auth import get_current_user  

router = APIRouter(prefix="/notifications", tags=["notifications"])

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# ---------------------------------------------------------------------------
# Pydantic schema
# ---------------------------------------------------------------------------

class NotificationRead(BaseModel):
    id: UUID
    user_id: UUID
    message: str
    link: str | None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# WebSocket Auth Helper
# ---------------------------------------------------------------------------

def get_user_ws(token: str, session: Session) -> User:
    """Decodes the JWT from a WebSocket query parameter."""
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], audience="authenticated")
        supabase_uid = payload.get("sub")
        if supabase_uid is None:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
            
        user = session.exec(select(User).where(User.supabase_id == supabase_uid)).first()
        if user is None:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
            
        return user
    except JWTError:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

# ---------------------------------------------------------------------------
# WebSocket connection manager
# ---------------------------------------------------------------------------

class NotificationManager:
    def __init__(self) -> None:
        self.active: Dict[UUID, Set[WebSocket]] = {}

    async def connect(self, user_id: UUID, ws: WebSocket) -> None:
        await ws.accept()
        self.active.setdefault(user_id, set()).add(ws)

    def disconnect(self, user_id: UUID, ws: WebSocket) -> None:
        if user_id in self.active:
            self.active[user_id].discard(ws)

    async def push(self, user_id: UUID, data: dict) -> None:
        for ws in list(self.active.get(user_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                self.active[user_id].discard(ws)

notification_manager = NotificationManager()

# ---------------------------------------------------------------------------
# GET /notifications
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[NotificationRead])
def get_notifications(
    current_user: User = Depends(get_current_user),
    session: SessionDep = Depends(get_session),
) -> List[Notification]:
    notifications = session.exec(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
    ).all()
    return notifications

# ---------------------------------------------------------------------------
# PATCH /notifications/{id}/read
# ---------------------------------------------------------------------------

@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_one_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    session: SessionDep = Depends(get_session),
) -> Notification:
    notif = session.get(Notification, notification_id)

    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notif.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this notification")

    notif.is_read = True
    session.add(notif)
    session.commit()
    session.refresh(notif)

    return notif

# ---------------------------------------------------------------------------
# PATCH /notifications/read-all
# ---------------------------------------------------------------------------

@router.patch("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    session: SessionDep = Depends(get_session),
) -> dict:
    unread = session.exec(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .where(not Notification.is_read)
    ).all()

    for notif in unread:
        notif.is_read = True
        session.add(notif)

    session.commit()

    return {"marked_read": len(unread)}

# ---------------------------------------------------------------------------
# WS /notifications/ws
# ---------------------------------------------------------------------------

@router.websocket("/ws")
async def websocket_notifications(
    ws: WebSocket,
    session: SessionDep,
    token: str = Query(...)
) -> None:
    # Authenticate via URL token
    user = get_user_ws(token, session)
    
    await notification_manager.connect(user.id, ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        notification_manager.disconnect(user.id, ws)