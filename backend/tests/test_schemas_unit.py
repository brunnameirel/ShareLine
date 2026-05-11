"""Pydantic schema validation (API contracts)."""

import pytest
from pydantic import ValidationError

from schemas import UserCreate, UserLogin


def test_user_create_accepts_roles():
    u = UserCreate(name="Pat", is_donor=True, is_requester=False)
    assert u.name == "Pat"
    assert u.is_donor is True


def test_user_login_requires_valid_email():
    with pytest.raises(ValidationError):
        UserLogin(email="not-an-email", password="secret12345")


def test_user_login_accepts_valid_email():
    u = UserLogin(email="pat@school.edu", password="secret12345")
    assert u.email == "pat@school.edu"
