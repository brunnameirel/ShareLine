"""Messaging with optional Perspective moderation."""

import perspective_client


def _approved_request_id(auth_client, donor_user, requester_user, sample_item):
    rq = auth_client(requester_user)
    create = rq.post(
        "/requests",
        json={"item_id": str(sample_item.id), "requested_quantity": 1},
    )
    assert create.status_code == 201
    rid = create.json()["id"]
    dn = auth_client(donor_user)
    patch = dn.patch(f"/requests/{rid}", json={"status": "Approved"})
    assert patch.status_code == 200
    return rid


def test_send_message_without_perspective_key(
    auth_client,
    donor_user,
    requester_user,
    sample_item,
):
    req_id = _approved_request_id(auth_client, donor_user, requester_user, sample_item)
    rq = auth_client(requester_user)
    res = rq.post(f"/messages/{req_id}", json={"body": "Can we meet at 3pm?"})
    assert res.status_code == 201
    assert res.json()["body"] == "Can we meet at 3pm?"


def test_send_message_passes_moderation_when_scores_low(
    monkeypatch,
    auth_client,
    donor_user,
    requester_user,
    sample_item,
):
    monkeypatch.setenv("PERSPECTIVE_API_KEY", "test-key")
    monkeypatch.setattr(perspective_client, "analyze_text", lambda text, timeout=None: 0.05)

    req_id = _approved_request_id(auth_client, donor_user, requester_user, sample_item)
    rq = auth_client(requester_user)
    res = rq.post(f"/messages/{req_id}", json={"body": "Thanks for the coat!"})
    assert res.status_code == 201


def test_send_message_rejected_when_scores_high(
    monkeypatch,
    auth_client,
    donor_user,
    requester_user,
    sample_item,
):
    monkeypatch.setenv("PERSPECTIVE_API_KEY", "test-key")
    monkeypatch.setattr(perspective_client, "analyze_text", lambda text, timeout=None: 0.99)

    req_id = _approved_request_id(auth_client, donor_user, requester_user, sample_item)
    rq = auth_client(requester_user)
    res = rq.post(f"/messages/{req_id}", json={"body": "hostile text"})
    assert res.status_code == 400
    assert "could not be sent" in res.json()["detail"].lower()
