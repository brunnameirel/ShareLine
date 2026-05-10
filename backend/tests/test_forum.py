def test_create_thread_returns_posts(auth_client, donor_user):
    c = auth_client(donor_user)
    res = c.post(
        "/forum/threads",
        json={
            "title": "ISO mini fridge",
            "category": "ISO",
            "body": "Looking for something small for the dorm.",
        },
    )
    assert res.status_code == 201
    body = res.json()
    assert body["title"] == "ISO mini fridge"
    assert len(body["posts"]) == 1
    assert body["posts"][0]["body"].startswith("Looking")


def test_list_threads_includes_created(auth_client, donor_user):
    c = auth_client(donor_user)
    c.post(
        "/forum/threads",
        json={"title": "Campus tip", "category": "Tips", "body": "Free food Fridays."},
    )
    listed = c.get("/forum/threads")
    assert listed.status_code == 200
    titles = {t["title"] for t in listed.json()}
    assert "Campus tip" in titles


def test_invalid_forum_category_returns_400(auth_client, donor_user):
    c = auth_client(donor_user)
    res = c.post(
        "/forum/threads",
        json={"title": "Bad", "category": "Misc", "body": "x"},
    )
    assert res.status_code == 400
