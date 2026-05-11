"""Unit-style tests for SQLModel tables (persistence + FK wiring on SQLite)."""

import uuid

from sqlmodel import Session, select

from db import engine
from models import (
    ForumPostTable,
    ForumThreadTable,
    ItemTable,
    MessageTable,
    NotificationTable,
    RequestTable,
    UserTable,
)


def test_user_defaults_and_roundtrip():
    uid = uuid.uuid4()
    with Session(engine) as session:
        u = UserTable(
            id=uid,
            supabase_id=f"sb-{uid.hex[:12]}",
            email=f"u{uid.hex[:8]}@t.example",
            name="Model Tester",
        )
        session.add(u)
        session.commit()
        session.refresh(u)
        assert u.is_donor is False
        assert u.is_requester is False

        loaded = session.get(UserTable, uid)
        assert loaded.name == "Model Tester"


def test_item_request_message_fk_chain():
    with Session(engine) as session:
        donor = UserTable(
            supabase_id="sb-donor-model",
            email="donor-model@t.example",
            name="Donor",
            is_donor=True,
        )
        req_user = UserTable(
            supabase_id="sb-req-model",
            email="req-model@t.example",
            name="Requester",
            is_requester=True,
        )
        session.add(donor)
        session.add(req_user)
        session.commit()
        session.refresh(donor)
        session.refresh(req_user)

        item = ItemTable(
            donor_id=donor.id,
            name="Desk lamp",
            category="Other",
            description="LED",
            condition="Good",
            quantity=1,
            location="Dorm A",
            status="Available",
        )
        session.add(item)
        session.commit()
        session.refresh(item)

        req = RequestTable(
            requester_id=req_user.id,
            item_id=item.id,
            requested_quantity=1,
            status="Approved",
        )
        item.status = "Reserved"
        session.add(req)
        session.add(item)
        session.commit()
        session.refresh(req)

        msg = MessageTable(
            request_id=req.id,
            sender_id=req_user.id,
            body="Pick up tomorrow?",
        )
        session.add(msg)
        session.commit()
        session.refresh(msg)

        rows = session.exec(select(MessageTable).where(MessageTable.request_id == req.id)).all()
        assert len(rows) == 1
        assert rows[0].body == "Pick up tomorrow?"


def test_forum_thread_post_and_notification():
    suf = uuid.uuid4().hex[:10]
    with Session(engine) as session:
        author = UserTable(
            supabase_id=f"sb-forum-author-{suf}",
            email=f"forum-a-{suf}@t.example",
            name="Author",
        )
        other = UserTable(
            supabase_id=f"sb-forum-other-{suf}",
            email=f"forum-o-{suf}@t.example",
            name="Other",
        )
        session.add(author)
        session.add(other)
        session.commit()
        session.refresh(author)
        session.refresh(other)

        from datetime import datetime

        now = datetime.utcnow()
        thread = ForumThreadTable(
            author_id=author.id,
            category="General",
            title="Q&A",
            created_at=now,
            updated_at=now,
        )
        session.add(thread)
        session.flush()

        post = ForumPostTable(thread_id=thread.id, author_id=author.id, body="First")
        session.add(post)

        n = NotificationTable(user_id=other.id, message="Ping", link="/forum/1")
        session.add(n)
        session.commit()

        t2 = session.get(ForumThreadTable, thread.id)
        assert t2.title == "Q&A"
