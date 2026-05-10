"""SQLModel ORM models for database tables.

These models are used for database operations. They inherit from SQLModel which
provides both Pydantic validation and SQLAlchemy ORM capabilities.
"""

from typing import Optional
from datetime import datetime
from sqlmodel import Field, SQLModel
from uuid import UUID, uuid4


class UserTable(SQLModel, table=True):
    """User table - stores user profiles"""
    __tablename__ = "user"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    supabase_id: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    name: str
    is_donor: bool = False
    is_requester: bool = False


class ItemTable(SQLModel, table=True):
    """Item table - stores item listings"""
    __tablename__ = "item"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    donor_id: UUID = Field(foreign_key="user.id", index=True)
    name: str
    category: str
    description: str
    condition: str
    quantity: int
    location: str
    photo_urls: Optional[str] = None
    status: str = "Available"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RequestTable(SQLModel, table=True):
    """Request table - stores item requests"""
    __tablename__ = "request"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    requester_id: UUID = Field(foreign_key="user.id", index=True)
    item_id: UUID = Field(foreign_key="item.id", index=True)
    requested_quantity: int
    status: str = "Pending"  # Pending | Approved | Rejected | Completed
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MessageTable(SQLModel, table=True):
    """Message table - stores messages in approved requests"""
    __tablename__ = "message"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    request_id: UUID = Field(foreign_key="request.id", index=True)
    sender_id: UUID = Field(foreign_key="user.id", index=True)
    body: str = Field(max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class NotificationTable(SQLModel, table=True):
    """Notification table - stores user notifications"""
    __tablename__ = "notification"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    message: str
    link: Optional[str] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ForumThreadTable(SQLModel, table=True):
    """Community forum thread (not tied to item/request messaging)."""

    __tablename__ = "forum_thread"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    author_id: UUID = Field(foreign_key="user.id", index=True)
    category: str = Field(max_length=64)
    title: str = Field(max_length=200)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ForumPostTable(SQLModel, table=True):
    """Post / reply within a forum thread."""

    __tablename__ = "forum_post"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    thread_id: UUID = Field(foreign_key="forum_thread.id", index=True)
    author_id: UUID = Field(foreign_key="user.id", index=True)
    body: str = Field(max_length=8000)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProfilesTable(SQLModel, table=True):
    """Profiles table - Supabase auth profiles"""
    __tablename__ = "profiles"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: Optional[datetime] = None
    email: Optional[str] = None
    name: Optional[str] = None
    phone_number: Optional[str] = None
    role: Optional[str] = None
