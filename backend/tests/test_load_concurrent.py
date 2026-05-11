"""Non-functional: concurrent API access (in-process client, many threads)."""

from concurrent.futures import ThreadPoolExecutor, as_completed


def test_concurrent_health_checks(client):
    """Simulate many simultaneous readers hitting a read-only endpoint."""

    def one():
        r = client.get("/")
        return r.status_code

    with ThreadPoolExecutor(max_workers=32) as pool:
        futures = [pool.submit(one) for _ in range(80)]
        codes = [f.result() for f in as_completed(futures)]
    assert all(c == 200 for c in codes)
