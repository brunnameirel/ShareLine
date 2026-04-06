from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel


# ---------------------------------------------------------------------------
# User
# email registration, Donor / Requester / both roles
# ---------------------------------------------------------------------------
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str
    password_hash: str

    # Role flags — a user may hold one or both roles (SRS §2.1)
    is_donor: bool = False
    is_requester: bool = False          


# ---------------------------------------------------------------------------
# Item
# title, category, description, condition, quantity, location,
#             optional photo uploads, status
# ---------------------------------------------------------------------------
class Item(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    donor_id: int = Field(foreign_key="user.id", index=True)

    name: str
    # SRS §2.6 categories: Clothing | Food | Bedding | Hygiene |
    #                       Textbooks | Electronics | Other
    category: str
    description: str
    # SRS §2.2 — condition field required on listing form
    condition: str                      # e.g. "New", "Good", "Fair"
    quantity: int
    # SRS §1.2 — campus locations across the Five College Consortium
    location: str                       # campus name / pickup spot

    # SRS §2.2 — one or more photos stored in object storage (Supabase Storage)
    # Store a comma-separated list of public URLs so we stay schema-simple
    photo_urls: Optional[str] = None    # e.g. "url1,url2"

    # SRS §2.5 — Available | Completed
    status: str = Field(default="Available")

    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Request
#  Pending → Approved → Completed (or Rejected)
# ---------------------------------------------------------------------------
class Request(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    requester_id: int = Field(foreign_key="user.id", index=True)
    item_id: int = Field(foreign_key="item.id", index=True)

    requested_quantity: int
    # SRS §2.5 — status lifecycle
    status: str = Field(default="Pending")  # Pending | Approved | Rejected | Completed

    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Message
# private thread per approved request; both parties can message
# ---------------------------------------------------------------------------
class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    request_id: int = Field(foreign_key="request.id", index=True)
    sender_id: int = Field(foreign_key="user.id")

    # SRS §3.7 failure case — max 1 000 characters
    body: str = Field(max_length=1000)

    created_at: datetime = Field(default_factory=datetime.utcnow)


# ---------------------------------------------------------------------------
# Notification
#  persisted notifications for requests, approvals, messages
# ---------------------------------------------------------------------------
class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)

    # Human-readable text shown in the notification bell
    message: str
    # Link to the relevant resource, e.g. "/requests/42"
    link: Optional[str] = None
    is_read: bool = Field(default=False)

    created_at: datetime = Field(default_factory=datetime.utcnow)
