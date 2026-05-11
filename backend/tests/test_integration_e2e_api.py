"""System-style API flow: request → approve → message → fetch history."""


def test_full_messaging_flow(auth_client, donor_user, requester_user, sample_item):
    rq = auth_client(requester_user)
    create = rq.post(
        "/requests",
        json={"item_id": str(sample_item.id), "requested_quantity": 1},
    )
    assert create.status_code == 201
    req_id = create.json()["id"]

    dn = auth_client(donor_user)
    assert dn.patch(f"/requests/{req_id}", json={"status": "Approved"}).status_code == 200

    send = rq.post(f"/messages/{req_id}", json={"body": "Thanks! Meet at 5."})
    assert send.status_code == 201

    hist = rq.get(f"/messages/{req_id}")
    assert hist.status_code == 200
    bodies = [m["body"] for m in hist.json()]
    assert "Thanks! Meet at 5." in bodies


def test_forum_thread_create_and_reply(auth_client, donor_user, requester_user):
    a = auth_client(donor_user)
    created = a.post(
        "/forum/threads",
        json={"title": "Pickup tips", "category": "Tips", "body": "Use campus lockers."},
    )
    assert created.status_code == 201
    thread_id = created.json()["id"]

    detail = a.get(f"/forum/threads/{thread_id}")
    assert detail.status_code == 200
    assert len(detail.json()["posts"]) == 1

    b = auth_client(requester_user)
    reply = b.post(
        f"/forum/threads/{thread_id}/posts",
        json={"body": "Great idea."},
    )
    assert reply.status_code == 201

    detail2 = b.get(f"/forum/threads/{thread_id}")
    assert len(detail2.json()["posts"]) == 2
