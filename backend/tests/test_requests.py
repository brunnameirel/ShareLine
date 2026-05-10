def test_cannot_request_own_item(auth_client, donor_user, sample_item):
    c = auth_client(donor_user)
    res = c.post(
        "/requests",
        json={"item_id": str(sample_item.id), "requested_quantity": 1},
    )
    assert res.status_code == 400


def test_request_then_approve_flow(auth_client, donor_user, requester_user, sample_item):
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

    item_check = dn.get(f"/items/{sample_item.id}")
    assert item_check.json()["status"] == "Reserved"


def test_duplicate_pending_request_rejected(
    auth_client,
    donor_user,
    requester_user,
    sample_item,
):
    rq = auth_client(requester_user)
    assert rq.post(
        "/requests",
        json={"item_id": str(sample_item.id), "requested_quantity": 1},
    ).status_code == 201
    second = rq.post(
        "/requests",
        json={"item_id": str(sample_item.id), "requested_quantity": 1},
    )
    assert second.status_code == 400
