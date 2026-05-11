"""Messaging with optional regex / blocklist moderation."""


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


def test_send_message_with_no_moderation_rules(
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


def test_send_message_rejected_when_blocklist_hit(
    monkeypatch,
    auth_client,
    donor_user,
    requester_user,
    sample_item,
):
    monkeypatch.setenv("MESSAGE_BLOCKLIST", "badword")
    req_id = _approved_request_id(auth_client, donor_user, requester_user, sample_item)
    rq = auth_client(requester_user)
    res = rq.post(f"/messages/{req_id}", json={"body": "This contains badword in the text"})
    assert res.status_code == 400
    assert "could not be sent" in res.json()["detail"].lower()


def test_send_message_blocklist_whole_word_only(
    monkeypatch,
    auth_client,
    donor_user,
    requester_user,
    sample_item,
):
    """'ass' must not match inside 'class'."""
    monkeypatch.setenv("MESSAGE_BLOCKLIST", "ass")
    req_id = _approved_request_id(auth_client, donor_user, requester_user, sample_item)
    rq = auth_client(requester_user)
    assert rq.post(f"/messages/{req_id}", json={"body": "Meet at class tomorrow"}).status_code == 201


def test_send_message_rejected_when_regex_matches(
    monkeypatch,
    auth_client,
    donor_user,
    requester_user,
    sample_item,
):
    monkeypatch.setenv("MESSAGE_MODERATION_REGEX", r"(?i)\bFORBIDDEN\b")
    req_id = _approved_request_id(auth_client, donor_user, requester_user, sample_item)
    rq = auth_client(requester_user)
    res = rq.post(f"/messages/{req_id}", json={"body": "Please read FORBIDDEN here"})
    assert res.status_code == 400
