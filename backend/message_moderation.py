
from __future__ import annotations

import logging
import os
import re
from typing import List

from fastapi import HTTPException

logger = logging.getLogger(__name__)

# Strip invisible characters sometimes used to evade naive filters.
_ZW_RE = re.compile(r"[\u200b-\u200d\ufeff]")


def _normalize(text: str) -> str:
    return _ZW_RE.sub("", text)


def _blocklist_terms() -> List[str]:
    raw = os.getenv("MESSAGE_BLOCKLIST", "").strip()
    if not raw:
        return []
    return [t.strip() for t in raw.split(",") if t.strip()]


def _matches_blocklist(text: str, term: str) -> bool:
    hay = _normalize(text)
    needle = _normalize(term)
    if not needle:
        return False
    if " " in needle:
        return needle.lower() in hay.lower()
    try:
        return re.search(rf"(?i)(?<!\w){re.escape(needle)}(?!\w)", hay) is not None
    except re.error:
        return needle.lower() in hay.lower()


def _matches_env_regex(text: str) -> bool:
    pattern = os.getenv("MESSAGE_MODERATION_REGEX", "").strip()
    if not pattern:
        return False
    try:
        return re.search(pattern, text, re.IGNORECASE | re.UNICODE) is not None
    except re.error as e:
        logger.warning("MESSAGE_MODERATION_REGEX invalid, skipping: %s", e)
        return False


def assert_text_allowed_for_message(text: str) -> None:
    """Reject the message body if it hits the blocklist or moderation regex."""
    if not text or not text.strip():
        return

    for term in _blocklist_terms():
        if _matches_blocklist(text, term):
            raise HTTPException(
                status_code=400,
                detail=(
                    "That message could not be sent. Please keep pickup coordination "
                    "respectful and free of harassment or slurs."
                ),
            )

    if _matches_env_regex(text):
        raise HTTPException(
            status_code=400,
            detail=(
                "That message could not be sent. Please keep pickup coordination "
                "respectful and free of harassment or slurs."
            ),
        )
