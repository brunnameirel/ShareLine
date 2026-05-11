"""
Google Perspective API (Comment Analyzer) for message moderation.

Docs: https://developers.perspectiveapi.com/s/docs-get-started

Set PERSPECTIVE_API_KEY to enable checks on POST /messages/....
If unset, moderation is skipped (local dev / CI without a key).
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict

import requests
from fastapi import HTTPException

logger = logging.getLogger(__name__)

PERSPECTIVE_URL = "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze"

# Attributes we score; reject if the max summary score exceeds the threshold.
_REQUESTED_ATTRIBUTES = {
    "TOXICITY": {},
    "SEVERE_TOXICITY": {},
    "THREAT": {},
    "INSULT": {},
    "IDENTITY_ATTACK": {},
}


def _max_score(response_json: Dict[str, Any]) -> float:
    scores = response_json.get("attributeScores") or {}
    peak = 0.0
    for attr in _REQUESTED_ATTRIBUTES:
        block = scores.get(attr) or {}
        summary = block.get("summaryScore") or {}
        val = float(summary.get("value", 0.0))
        if val > peak:
            peak = val
    return peak


def analyze_text(text: str, *, timeout: float | None = None) -> float:
    """
    Call Perspective and return the highest requested attribute score (0..1).

    Raises requests.HTTPError on non-2xx responses.
    """
    api_key = os.getenv("PERSPECTIVE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("PERSPECTIVE_API_KEY is not set")

    if timeout is None:
        timeout = float(os.getenv("PERSPECTIVE_REQUEST_TIMEOUT", "5"))

    payload = {
        "comment": {"text": text},
        "languages": ["en"],
        "requestedAttributes": _REQUESTED_ATTRIBUTES,
        "doNotStore": True,
    }
    res = requests.post(
        PERSPECTIVE_URL,
        params={"key": api_key},
        json=payload,
        timeout=timeout,
    )
    res.raise_for_status()
    return _max_score(res.json())


def moderation_enabled() -> bool:
    return bool(os.getenv("PERSPECTIVE_API_KEY", "").strip())


def assert_text_allowed_for_message(text: str) -> None:
    """
    If Perspective is configured, block abusive text before persisting.

    On Perspective network/API failure: fail open (allow) and log, so chat
    stays usable if Google is down; operators can tighten later.
    """
    if not moderation_enabled():
        return

    threshold = float(os.getenv("PERSPECTIVE_REJECT_ABOVE", "0.72"))
    try:
        score = analyze_text(text)
    except requests.RequestException as e:
        logger.warning("Perspective request failed; allowing message: %s", e)
        return
    except Exception as e:
        logger.warning("Perspective unexpected error; allowing message: %s", e)
        return

    if score >= threshold:
        raise HTTPException(
            status_code=400,
            detail=(
                "That message could not be sent. Please keep pickup coordination "
                "respectful and free of harassment or slurs."
            ),
        )
