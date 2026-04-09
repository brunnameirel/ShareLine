import os
from datetime import datetime
from typing import Dict, List, Set
from uuid import UUID

from fastapi import (
    APIRouter, Depends, HTTPException, WebSocket, 
    WebSocketDisconnect, WebSocketException, status, Query
)
from pydantic import BaseModel, Field
from sqlmodel import Session, select
from jose import JWTError, jwt

# Assuming these are your local imports based on your snippets
from db import SessionDep, engine
from models import MessageTable, NotificationTable, RequestTable, ItemTable, UserTable
from routers.auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])

# Ensure this matches your Supabase Project Settings > API > JWT Secret
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

# --- SCHEMAS ---

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

# --- WEBSOCKET CONNECTION MANAGER ---

class ConnectionManager:
    def __init__(self) -> None:
        # Maps request_id (thread) to a set of active WebSocket connections
        self.active_connections: Dict[UUID, Set[WebSocket]] = {}

    async def connect(self, request_id: UUID, websocket: WebSocket):
        await websocket.accept()
        if request_id not in self.active_connections:
            self.active_connections[request_id] = set()
        self.active_connections[request_id].add(websocket)

    def disconnect(self, request_id: UUID, websocket: WebSocket):
        if request_id in self.active_connections:
            self.active_connections[request_id].discard(websocket)
            if not self.active_connections[request_id]:
                del self.active_connections[request_id]

    async def broadcast(self, request_id: UUID, message_data: dict):
        """Sends a JSON message to everyone listening to a specific thread."""
        if request_id in self.active_connections:
            for connection in list(self.active_connections[request_id]):
                try:
                    await connection.send_json(message_data)
                except Exception:
                    # Clean up stale connections if sending fails
                    self.active_connections[request_id].discard(connection)

manager = ConnectionManager()

# --- HELPERS ---

def get_user_from_ws_token(token: str, session: Session) -> UserTable:
    """Validates Supabase JWT for WebSocket connections."""
    try:
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=["HS256"], 
            options={"verify_aud": False}
        )
        supabase_uid = payload.get("sub")
        if not supabase_uid:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
            
        user = session.exec(select(UserTable).where(UserTable.supabase_id == supabase_uid)).first()
        if not user:
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
        return user
    except JWTError:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

def validate_thread_access(request_id: UUID, user: UserTable, session: Session) -> RequestTable:
    """Ensures thread is active and user is either the donor or requester."""
    req = session.get(RequestTable, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request thread not found")

    if req.status != "Approved":
        raise HTTPException(
            status_code=400, 
            detail=f"Chat only allowed for Approved requests. Current: {req.status}"
        )

    item = session.get(ItemTable, req.item_id)
    if user.id not in [req.requester_id, item.donor_id]:
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")
    
    return req

def notify_user(user_id: UUID, message: str, link: str, session: Session):
    """Inserts a notification into the DB for the recipient."""
    new_notif = NotificationTable(
        user_id=user_id,
        message=message,
        link=link,
        is_read=False,
        created_at=datetime.utcnow()
    )
    session.add(new_notif)

# --- ENDPOINTS ---

@router.get("/{request_id}", response_model=List[MessageRead])
def fetch_chat_history(
    request_id: UUID,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user)
):
    """Retrieves all past messages for a thread."""
    validate_thread_access(request_id, current_user, session)
    return session.exec(
        select(MessageTable)
        .where(MessageTable.request_id == request_id)
        .order_by(MessageTable.created_at)
    ).all()

@router.post("/{request_id}", response_model=MessageRead)
async def send_new_message(
    request_id: UUID,
    payload: MessageCreate,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user)
):
    """Saves message to DB, broadcasts to WS, and notifies the recipient."""
    req = validate_thread_access(request_id, current_user, session)
    item = session.get(ItemTable, req.item_id)

    # 1. Create and save message
    msg = MessageTable(
        request_id=request_id,
        sender_id=current_user.id,
        body=payload.body,
        created_at=datetime.utcnow()
    )
    session.add(msg)

    # 2. Determine recipient for notification
    recipient_id = item.donor_id if current_user.id == req.requester_id else req.requester_id
    preview = (payload.body[:47] + "...") if len(payload.body) > 50 else payload.body
    
    notify_user(
        user_id=recipient_id,
        message=f"New message regarding {item.name}: {preview}",
        link=f"/messages/{request_id}",
        session=session
    )

    session.commit()
    session.refresh(msg)

    # 3. Broadcast to any active WebSocket listeners
    await manager.broadcast(request_id, {
        "id": str(msg.id),
        "request_id": str(msg.request_id),
        "sender_id": str(msg.sender_id),
        "body": msg.body,
        "created_at": msg.created_at.isoformat()
    })

    return msg

@router.websocket("/{request_id}/ws")
async def chat_socket_endpoint(
    request_id: UUID,
    websocket: WebSocket,
    token: str = Query(...)
):
    """WebSocket bridge for real-time UI updates."""
    with Session(engine) as session:
        try:
            user = get_user_from_ws_token(token, session)
            validate_thread_access(request_id, user, session)
        except (WebSocketException, HTTPException):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        await manager.connect(request_id, websocket)
        try:
            while True:
                # We mainly use WS to push data TO the client.
                # Client sends data via the POST endpoint for better validation/logic.
                await websocket.receive_text() 
        except WebSocketDisconnect:
            manager.disconnect(request_id, websocket)