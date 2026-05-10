def test_create_and_fetch_item(auth_client, donor_user):
    c = auth_client(donor_user)
    payload = {
        "name": "Bio textbook",
        "category": "Textbooks",
        "description": "Intro bio",
        "condition": "Good",
        "quantity": 1,
        "location": "Science quad",
    }
    res = c.post("/items", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["name"] == payload["name"]
    assert body["category"] == "Textbooks"
    assert body["donor_id"] == str(donor_user.id)

    got = c.get(f"/items/{body['id']}")
    assert got.status_code == 200
    assert got.json()["name"] == payload["name"]


def test_create_item_rejects_invalid_category(auth_client, donor_user):
    c = auth_client(donor_user)
    res = c.post(
        "/items",
        json={
            "name": "x",
            "category": "InvalidCat",
            "description": "d",
            "condition": "Good",
            "quantity": 1,
            "location": "here",
        },
    )
    assert res.status_code == 400


def test_list_items_returns_available(auth_client, donor_user, requester_user, sample_item):
    viewer = auth_client(requester_user)
    res = viewer.get("/items")
    assert res.status_code == 200
    rows = res.json()
    assert len(rows) >= 1
    ids = {r["id"] for r in rows}
    assert str(sample_item.id) in ids


def test_get_mine_includes_requests(auth_client, donor_user, sample_item):
    c = auth_client(donor_user)
    res = c.get("/items/mine")
    assert res.status_code == 200
    rows = res.json()
    assert len(rows) == 1
    assert rows[0]["name"] == sample_item.name
    assert "requests" in rows[0]
