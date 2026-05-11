"""Unit checks for message_moderation helpers (no HTTP)."""

import pytest
from fastapi import HTTPException

from message_moderation import assert_text_allowed_for_message


def test_clean_message_allowed():
    assert_text_allowed_for_message("See you at the library steps at 4.")


def test_builtin_profanity_blocked():
    with pytest.raises(HTTPException) as ei:
        assert_text_allowed_for_message("you fuck off")
    assert ei.value.status_code == 400


def test_whitespace_only_skipped():
    assert_text_allowed_for_message("   ")
