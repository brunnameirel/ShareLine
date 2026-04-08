from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel
from uuid import UUID


# ---------------------------------------------------------------------------
# User
# email registration, Donor / Requester / both roles
# ---------------------------------------------------------------------------
class User(SQLModel, table=True):
    id: Optional[UUID] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    password_hash: str

    # Role flags — a user may hold one or both roles
    is_donor: bool = False
    is_requester: bool = False          


# ---------------------------------------------------------------------------
# Item
# title, category, description, condition, quantity, location,
#             optional photo uploads, status
# ---------------------------------------------------------------------------
class Item(SQLModel, table=True):
    id: Optional[UUID] = Field(default=None, primary_key=True)
    donor_id: UUID = Field(foreign_key="user.id", index=True)

    name: str
    #categories: Clothing | Food | Bedding | Hygiene |
    #                       Textbooks | Electronics | Other
    category: str
    description: str
    # condition field required on listing form
    condition: str                      # e.g. "New", "Good", "Fair"
    quantity: int
    # campus locations across the Five College Consortium
    location: str                       # campus name / pickup spot

    # one or more photos stored in object storage (Supabase Storage)
    # Store a comma-separated list of public URLs so we stay schema-simple
    photo_urls: Optional[str] = None    # e.g. "url1,url2"

    
    status: str = Field(default="Available")

    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Request
#  Pending → Approved → Completed (or Rejected)
# ---------------------------------------------------------------------------
class Request(SQLModel, table=True):
    id: Optional[UUID] = Field(default=None, primary_key=True)
    requester_id: UUID = Field(foreign_key="user.id", index=True)
    item_id: UUID = Field(foreign_key="item.id", index=True)

    requested_quantity: int
    #status lifecycle
    status: str = Field(default="Pending")  # Pending | Approved | Rejected | Completed

    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Message
# private thread per approved request; both parties can message
# ---------------------------------------------------------------------------
class Message(SQLModel, table=True):
    id: Optional[UUID] = Field(default=None, primary_key=True)
    request_id: UUID = Field(foreign_key="request.id", index=True)
    sender_id: UUID = Field(foreign_key="user.id")

    #failure case — max 1 000 characters
    body: str = Field(max_length=1000)

    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Notification
#  persisted notifications for requests, approvals, messages
# ---------------------------------------------------------------------------
class Notification(SQLModel, table=True):
    id: Optional[UUID] = Field(default=None, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)

    
    message: str
    # Link to the relevant resource, e.g. "/requests/42"
    link: Optional[str] = None
    is_read: bool = Field(default=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)
