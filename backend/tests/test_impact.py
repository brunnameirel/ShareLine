def test_impact_summary_reflects_listings_and_requests(
    auth_client,
    donor_user,
    requester_user,
    sample_item,
):
    assert (
        auth_client(requester_user).post(
            "/requests",
            json={"item_id": str(sample_item.id), "requested_quantity": 1},
        ).status_code
        == 201
    )

    donor_res = auth_client(donor_user).get("/impact/summary")
    assert donor_res.status_code == 200
    g = donor_res.json()["giving"]
    assert g["items_listed"] == 1
    assert g["units_listed"] == 2
    assert g["estimated_value_usd"] > 0

    recv_res = auth_client(requester_user).get("/impact/summary")
    assert recv_res.status_code == 200
    r = recv_res.json()["receiving"]
    assert r["active_requests"] == 1
    assert r["units_requested"] == 1


def test_impact_receiving_zero_when_request_rejected(
    auth_client,
    donor_user,
    requester_user,
    sample_item,
):
    create_res = auth_client(requester_user).post(
        "/requests",
        json={"item_id": str(sample_item.id), "requested_quantity": 1},
    )
    assert create_res.status_code == 201
    request_id = create_res.json()["id"]

    patch_res = auth_client(donor_user).patch(
        f"/requests/{request_id}",
        json={"status": "Rejected"},
    )
    assert patch_res.status_code == 200

    recv_res = auth_client(requester_user).get("/impact/summary")
    assert recv_res.json()["receiving"]["active_requests"] == 0
