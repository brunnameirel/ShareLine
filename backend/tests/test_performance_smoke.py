"""Non-functional smoke: basic latency envelope for hot read paths."""

import time


def test_list_items_endpoint_under_loose_budget(auth_client, donor_user, requester_user, sample_item):
    c = auth_client(requester_user)
    start = time.perf_counter()
    for _ in range(25):
        r = c.get("/items")
        assert r.status_code == 200
    elapsed = time.perf_counter() - start
    assert elapsed < 8.0, f"25 sequential /items calls took {elapsed:.2f}s"
