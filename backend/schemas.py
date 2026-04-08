
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID

#Create = what the client sends in
# Read = what the API sends back
# Update = what the client sends for edits.

# User 
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str = Field(min_length=8)
    is_donor: bool = False
    is_requester: bool = False


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    active_role: str  # "donor" | "requester"


class UserRead(BaseModel):
    id: UUID
    email: str
    name: str
    is_donor: bool
    is_requester: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Item 

class ItemCreate(BaseModel):
    name: str
    category: str  # Clothing | Food | Bedding | Hygiene | Textbooks | Electronics | Other
    description: str
    condition: str  # New | Good | Fair
    quantity: int = Field(gt=0)
    location: str
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
    photo_urls: Optional[str] = None
    status: str
    created_at: datetime


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    condition: Optional[str] = None
    quantity: Optional[int] = None
    location: Optional[str] = None
    photo_urls: Optional[str] = None
    status: Optional[str] = None


# Request

class RequestCreate(BaseModel):
    item_id: UUID
    requested_quantity: int = Field(gt=0)


class RequestRead(BaseModel):
    id: UUID
    requester_id: UUID
    item_id: UUID
    requested_quantity: int
    status: str
    created_at: datetime


class RequestUpdate(BaseModel):
    status: str  # Approved | Rejected | Completed


# Message

class MessageCreate(BaseModel):
    request_id: UUID
    body: str = Field(max_length=1000)


class MessageRead(BaseModel):
    id: UUID
    request_id: UUID
    sender_id: UUID
    body: str
    created_at: datetime


# Notification 

class NotificationRead(BaseModel):
    id: UUID
    user_id: UUID
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime


class NotificationUpdate(BaseModel):
    is_read: bool = True