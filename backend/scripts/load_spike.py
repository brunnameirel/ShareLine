#!/usr/bin/env python3
"""
Optional spike load test against a *running* API (not pytest).

  cd backend && python scripts/load_spike.py --url http://127.0.0.1:8000 --workers 50 --requests 200

Uses concurrent GET / only (no auth). For course write-ups: compare wall time
and failures under different --workers values.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import sys
import time
import urllib.error
import urllib.request


def one_get(base: str) -> int:
    req = urllib.request.Request(f"{base.rstrip('/')}/", method="GET")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def main() -> int:
    p = argparse.ArgumentParser(description="Concurrent GET / load spike")
    p.add_argument("--url", default="http://127.0.0.1:8000", help="API base URL")
    p.add_argument("--workers", type=int, default=40, help="Thread pool size")
    p.add_argument("--requests", type=int, default=200, help="Total GET requests")
    args = p.parse_args()

    start = time.perf_counter()
    bad = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        codes = list(pool.map(lambda _: one_get(args.url), range(args.requests)))
    elapsed = time.perf_counter() - start
    for c in codes:
        if c != 200:
            bad += 1

    print(f"Completed {args.requests} requests in {elapsed:.2f}s ({args.requests / elapsed:.1f} req/s)")
    print(f"Non-200 responses: {bad}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
