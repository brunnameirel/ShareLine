"""
Mandatory message moderation: built-in word list plus optional env extras.

Always loads moderation_builtin_terms.txt next to this module (one term per line).
MESSAGE_BLOCKLIST adds more comma-separated terms. MESSAGE_MODERATION_REGEX is optional.
"""

from __future__ import annotations

import logging
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import List

from fastapi import HTTPException

logger = logging.getLogger(__name__)

_ZW_RE = re.compile(r"[\u200b-\u200d\ufeff]")

# Minimal fallback if the packaged word file is missing (should not happen in production).
_FALLBACK_TERMS = ("fuck", "shit", "nigger", "faggot", "rape", "kike")


def _normalize(text: str) -> str:
    return _ZW_RE.sub("", text)


@lru_cache(maxsize=1)
def _builtin_term_list() -> tuple[str, ...]:
    path = Path(__file__).with_name("moderation_builtin_terms.txt")
    if not path.is_file():
        logger.error("moderation_builtin_terms.txt missing; using minimal fallback list")
        return _FALLBACK_TERMS
    terms: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        terms.append(line)
    if not terms:
        logger.error("moderation_builtin_terms.txt empty; using minimal fallback list")
        return _FALLBACK_TERMS
    return tuple(terms)


def _extra_blocklist_terms() -> List[str]:
    raw = os.getenv("MESSAGE_BLOCKLIST", "").strip()
    if not raw:
        return []
    return [t.strip() for t in raw.split(",") if t.strip()]


def _all_blocklist_terms() -> List[str]:
    return list(_builtin_term_list()) + _extra_blocklist_terms()


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
    """Reject the message body if it hits any blocklist term or the optional moderation regex."""
    if not text or not text.strip():
        return

    for term in _all_blocklist_terms():
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
