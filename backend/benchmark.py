"""
API response time benchmark.
Usage:
    venv/bin/python benchmark.py

Requires the backend to be running:
    venv/bin/uvicorn main:app --port 8000
"""

import statistics
import time
import httpx

BASE = "http://localhost:8000"
ITERATIONS = 100          # requests per endpoint
WARMUP = 10               # discarded warm-up requests

# ── Auth ──────────────────────────────────────────────────
def get_token() -> str:
    r = httpx.post(f"{BASE}/api/auth/login", json={
        "email": "zhygailo@helpdesk.ua",
        "password": "operator123",
    })
    r.raise_for_status()
    return r.json()["access_token"]


def get_ticket_id(token: str) -> str:
    r = httpx.get(
        f"{BASE}/api/tickets",
        params={"page": 1, "limit": 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    r.raise_for_status()
    items = r.json().get("items", [])
    return items[0]["id"] if items else "TK-1041"


# ── Measurement ───────────────────────────────────────────
def measure(fn, n: int = ITERATIONS, warmup: int = WARMUP) -> list[float]:
    """Run fn (n + warmup) times, return latencies in ms (warmup discarded)."""
    times: list[float] = []
    for i in range(n + warmup):
        t0 = time.perf_counter()
        fn()
        ms = (time.perf_counter() - t0) * 1000
        if i >= warmup:
            times.append(ms)
    return times


def p(data: list[float], pct: float) -> float:
    sorted_data = sorted(data)
    idx = int(len(sorted_data) * pct / 100)
    return round(sorted_data[min(idx, len(sorted_data) - 1)], 1)


# ── Main ──────────────────────────────────────────────────
def main():
    print(f"Warming up and measuring {ITERATIONS} requests per endpoint...\n")

    token = get_token()
    ticket_id = get_ticket_id(token)
    headers = {"Authorization": f"Bearer {token}"}

    endpoints: list[tuple[str, callable]] = [
        (
            "POST /api/auth/login",
            lambda: httpx.post(f"{BASE}/api/auth/login", json={
                "email": "zhygailo@helpdesk.ua",
                "password": "operator123",
            }),
        ),
        (
            "GET /api/auth/me",
            lambda: httpx.get(f"{BASE}/api/auth/me", headers=headers),
        ),
        (
            "POST /api/tickets",
            lambda: httpx.post(f"{BASE}/api/tickets", headers=headers, json={
                "title": "Benchmark test ticket",
                "description": "Автоматично створений тікет для вимірювання продуктивності.",
                "request_type": "technical",
                "priority": "auto",
            }),
        ),
        (
            "GET /api/tickets?page=1",
            lambda: httpx.get(f"{BASE}/api/tickets", headers=headers, params={"page": 1}),
        ),
        (
            f"GET /api/tickets/{{id}}",
            lambda: httpx.get(f"{BASE}/api/tickets/{ticket_id}", headers=headers),
        ),
        (
            "PATCH /api/tickets/{id}/assign",
            lambda: httpx.patch(
                f"{BASE}/api/tickets/{ticket_id}/assign",
                headers=headers,
                json={"operator_id": httpx.get(
                    f"{BASE}/api/auth/me", headers=headers
                ).json()["id"]},
            ),
        ),
        (
            "GET /api/dashboard",
            lambda: httpx.get(f"{BASE}/api/dashboard", headers=headers),
        ),
    ]

    col_w = [36, 12, 10, 10]
    header = (
        f"{'Endpoint':<{col_w[0]}}"
        f"{'Median (ms)':>{col_w[1]}}"
        f"{'P95 (ms)':>{col_w[2]}}"
        f"{'P99 (ms)':>{col_w[3]}}"
    )
    separator = "-" * sum(col_w)

    print(header)
    print(separator)

    for label, fn in endpoints:
        try:
            times = measure(fn)
            med = round(statistics.median(times), 1)
            p95 = p(times, 95)
            p99 = p(times, 99)
            print(
                f"{label:<{col_w[0]}}"
                f"{med:>{col_w[1]}}"
                f"{p95:>{col_w[2]}}"
                f"{p99:>{col_w[3]}}"
            )
        except Exception as e:
            print(f"{label:<{col_w[0]}} ERROR: {e}")

    print(separator)
    print(f"\nN = {ITERATIONS} requests per endpoint  |  Warmup = {WARMUP} discarded")
    print(f"Server: {BASE}  |  DB: SQLite (local)")


if __name__ == "__main__":
    main()
