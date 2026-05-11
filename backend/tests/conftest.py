"""Pytest fixtures: in-memory SQLite, fresh schema, optional auth override."""

from __future__ import annotations

import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret-for-ci-only")

from db import engine  # noqa: E402
from main import app  # noqa: E402
from models import ItemTable, UserTable  # noqa: E402
from routers.auth import get_current_user  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_database(monkeypatch):
    """Stable DB and moderation env so local .env does not affect assertions."""
    monkeypatch.delenv("MESSAGE_BLOCKLIST", raising=False)
    monkeypatch.delenv("MESSAGE_MODERATION_REGEX", raising=False)
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def make_user(
    *,
    name: str = "Test User",
    email: str | None = None,
    supabase_id: str | None = None,
    is_donor: bool = True,
    is_requester: bool = True,
) -> UserTable:
    uid = uuid.uuid4()
    with Session(engine) as session:
        u = UserTable(
            id=uid,
            supabase_id=supabase_id or f"sb-{uid.hex[:16]}",
            email=email or f"user-{uid.hex[:8]}@example.com",
            name=name,
            is_donor=is_donor,
            is_requester=is_requester,
        )
        session.add(u)
        session.commit()
        session.refresh(u)
        return u


@pytest.fixture
def donor_user() -> UserTable:
    return make_user(name="Donor Alice")


@pytest.fixture
def requester_user() -> UserTable:
    return make_user(name="Requester Bob")


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def auth_client():
    """Build a TestClient that acts as the given user (overrides JWT auth)."""

    def factory(user: UserTable) -> TestClient:
        app.dependency_overrides[get_current_user] = lambda: user
        return TestClient(app)

    return factory


@pytest.fixture
def sample_item(donor_user: UserTable) -> ItemTable:
    with Session(engine) as session:
        item = ItemTable(
            donor_id=donor_user.id,
            name="Winter coat",
            category="Clothing",
            description="Warm coat",
            condition="Good",
            quantity=2,
            location="Library steps",
            status="Available",
        )
        session.add(item)
        session.commit()
        session.refresh(item)
        return item
