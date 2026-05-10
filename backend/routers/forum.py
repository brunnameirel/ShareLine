"""Community forum — threads and posts (separate from request-scoped messaging)."""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from db import SessionDep
from models import ForumPostTable, ForumThreadTable, NotificationTable, UserTable
from routers.auth import get_current_user

router = APIRouter(prefix="/forum", tags=["forum"])

VALID_CATEGORIES = {"General", "Tips", "ISO", "Campus"}


class ForumThreadCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    category: str
    body: str = Field(..., min_length=1, max_length=8000)


class ForumPostCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=8000)


class ForumPostRead(BaseModel):
    id: UUID
    thread_id: UUID
    author_id: UUID
    author_name: str
    body: str
    created_at: datetime

    class Config:
        from_attributes = True


class ForumThreadListRead(BaseModel):
    id: UUID
    title: str
    category: str
    author_id: UUID
    author_name: str
    post_count: int
    created_at: datetime
    updated_at: datetime


class ForumThreadDetailRead(BaseModel):
    id: UUID
    title: str
    category: str
    author_id: UUID
    author_name: str
    created_at: datetime
    updated_at: datetime
    posts: List[ForumPostRead]


def _post_count(session: Session, thread_id: UUID) -> int:
    rows = session.exec(select(ForumPostTable.id).where(ForumPostTable.thread_id == thread_id)).all()
    return len(rows)


def _notify(session: Session, user_id: UUID, message: str, link: Optional[str] = None) -> None:
    session.add(NotificationTable(user_id=user_id, message=message, link=link))


def _author_name(session: Session, user_id: UUID) -> str:
    u = session.get(UserTable, user_id)
    return u.name if u else "Unknown"


@router.get("/threads", response_model=List[ForumThreadListRead])
def list_threads(
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
    category: Optional[str] = Query(None),
) -> List[ForumThreadListRead]:
    stmt = select(ForumThreadTable).order_by(ForumThreadTable.updated_at.desc())
    threads = session.exec(stmt).all()
    out: List[ForumThreadListRead] = []
    for t in threads:
        if category and t.category != category:
            continue
        out.append(
            ForumThreadListRead(
                id=t.id,
                title=t.title,
                category=t.category,
                author_id=t.author_id,
                author_name=_author_name(session, t.author_id),
                post_count=_post_count(session, t.id),
                created_at=t.created_at,
                updated_at=t.updated_at,
            )
        )
    return out


@router.post("/threads", response_model=ForumThreadDetailRead, status_code=201)
def create_thread(
    data: ForumThreadCreate,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
) -> ForumThreadDetailRead:
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Use one of: {', '.join(sorted(VALID_CATEGORIES))}",
        )

    now = datetime.utcnow()
    thread = ForumThreadTable(
        author_id=current_user.id,
        category=data.category,
        title=data.title,
        created_at=now,
        updated_at=now,
    )
    session.add(thread)
    # Parent row must exist in DB before forum_post insert (FK). Without a mapped
    # relationship, SQLAlchemy may otherwise INSERT forum_post first.
    session.flush()

    post = ForumPostTable(
        thread_id=thread.id,
        author_id=current_user.id,
        body=data.body,
    )
    session.add(post)
    session.commit()
    session.refresh(thread)
    session.refresh(post)

    return ForumThreadDetailRead(
        id=thread.id,
        title=thread.title,
        category=thread.category,
        author_id=thread.author_id,
        author_name=current_user.name,
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        posts=[
            ForumPostRead(
                id=post.id,
                thread_id=post.thread_id,
                author_id=post.author_id,
                author_name=current_user.name,
                body=post.body,
                created_at=post.created_at,
            )
        ],
    )


@router.get("/threads/{thread_id}", response_model=ForumThreadDetailRead)
def get_thread(
    thread_id: UUID,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
) -> ForumThreadDetailRead:
    thread = session.get(ForumThreadTable, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    posts = session.exec(
        select(ForumPostTable)
        .where(ForumPostTable.thread_id == thread_id)
        .order_by(ForumPostTable.created_at)
    ).all()

    post_reads = [
        ForumPostRead(
            id=p.id,
            thread_id=p.thread_id,
            author_id=p.author_id,
            author_name=_author_name(session, p.author_id),
            body=p.body,
            created_at=p.created_at,
        )
        for p in posts
    ]

    return ForumThreadDetailRead(
        id=thread.id,
        title=thread.title,
        category=thread.category,
        author_id=thread.author_id,
        author_name=_author_name(session, thread.author_id),
        created_at=thread.created_at,
        updated_at=thread.updated_at,
        posts=post_reads,
    )


@router.post("/threads/{thread_id}/posts", response_model=ForumPostRead, status_code=201)
def create_post(
    thread_id: UUID,
    data: ForumPostCreate,
    session: SessionDep,
    current_user: UserTable = Depends(get_current_user),
) -> ForumPostRead:
    thread = session.get(ForumThreadTable, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    post = ForumPostTable(thread_id=thread_id, author_id=current_user.id, body=data.body)
    session.add(post)

    thread.updated_at = datetime.utcnow()
    session.add(thread)

    # Notify thread author when someone else replies
    if thread.author_id != current_user.id:
        preview = data.body[:80] + ("…" if len(data.body) > 80 else "")
        _notify(
            session,
            thread.author_id,
            f'New reply on "{thread.title}": {preview}',
            f"/forum/{thread_id}",
        )

    session.commit()
    session.refresh(post)

    return ForumPostRead(
        id=post.id,
        thread_id=post.thread_id,
        author_id=post.author_id,
        author_name=current_user.name,
        body=post.body,
        created_at=post.created_at,
    )
