"""Tests for /api/tickets endpoints."""
import pytest
from tests.conftest import register_and_login, auth_headers


def _create_ticket(client, **kwargs):
    payload = {
        "title": "Test Issue",
        "description": "Something is broken",
        "request_type": "technical",
        "priority": "auto",
        **kwargs,
    }
    return client.post("/api/tickets", json=payload)


# ── create ────────────────────────────────────────────────────────────────────

def test_create_ticket_anonymous(client):
    r = _create_ticket(client)
    assert r.status_code == 201
    data = r.json()
    assert data["title"] == "Test Issue"
    assert data["status"] == "new"
    assert data["priority"] == "medium"
    assert data["user_id"] is None


def test_create_ticket_authenticated(client):
    token = register_and_login(client, "u@test.com", "User", "pass", "user")
    r = _create_ticket(client, headers=auth_headers(token))
    # pass headers via request
    r = client.post("/api/tickets", json={
        "title": "My Ticket", "description": "Desc",
        "request_type": "consultation", "priority": "auto",
    }, headers=auth_headers(token))
    assert r.status_code == 201
    assert r.json()["user_id"] is not None


def test_create_ticket_explicit_priority(client):
    r = _create_ticket(client, priority="high")
    assert r.status_code == 201
    assert r.json()["priority"] == "high"


def test_create_ticket_payment_type(client):
    r = _create_ticket(client, request_type="payment")
    assert r.status_code == 201
    assert r.json()["request_type"] == "payment"


def test_create_ticket_increments_id(client):
    r1 = _create_ticket(client)
    r2 = _create_ticket(client)
    assert r1.json()["id"] != r2.json()["id"]


# ── get ───────────────────────────────────────────────────────────────────────

def test_get_ticket_found(client):
    ticket_id = _create_ticket(client).json()["id"]
    r = client.get(f"/api/tickets/{ticket_id}")
    assert r.status_code == 200
    assert r.json()["id"] == ticket_id


def test_get_ticket_not_found(client):
    r = client.get("/api/tickets/TK-9999")
    assert r.status_code == 404


# ── list (operator only) ──────────────────────────────────────────────────────

def test_list_tickets_unauthenticated(client):
    r = client.get("/api/tickets")
    assert r.status_code == 401


def test_list_tickets_as_user_forbidden(client):
    token = register_and_login(client, "u@test.com", "User", "pass", "user")
    r = client.get("/api/tickets", headers=auth_headers(token))
    assert r.status_code == 403


def test_list_tickets_as_operator(client):
    token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    _create_ticket(client)
    r = client.get("/api/tickets", headers=auth_headers(token))
    assert r.status_code == 200
    body = r.json()
    assert "items" in body
    assert body["total"] >= 1


def test_list_tickets_filter_status(client):
    token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    _create_ticket(client)
    r = client.get("/api/tickets?status=new", headers=auth_headers(token))
    assert r.status_code == 200


def test_list_tickets_filter_priority(client):
    token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    _create_ticket(client, priority="high")
    r = client.get("/api/tickets?priority=high", headers=auth_headers(token))
    assert r.status_code == 200
    for item in r.json()["items"]:
        assert item["priority"] == "high"


def test_list_tickets_search(client):
    token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    _create_ticket(client, title="Unique Searchable Title")
    r = client.get("/api/tickets?search=Unique", headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["total"] >= 1


# ── my tickets ────────────────────────────────────────────────────────────────

def test_my_tickets_unauthenticated(client):
    r = client.get("/api/tickets/my")
    assert r.status_code == 401


def test_my_tickets_returns_only_own(client):
    token = register_and_login(client, "u@test.com", "User", "pass", "user")
    client.post("/api/tickets", json={
        "title": "My T", "description": "D",
        "request_type": "technical", "priority": "auto"
    }, headers=auth_headers(token))
    # anonymous ticket should not appear
    _create_ticket(client)
    r = client.get("/api/tickets/my", headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["total"] == 1


def test_my_tickets_pagination(client):
    token = register_and_login(client, "u@test.com", "User", "pass", "user")
    for _ in range(3):
        client.post("/api/tickets", json={
            "title": "T", "description": "D",
            "request_type": "technical", "priority": "auto"
        }, headers=auth_headers(token))
    r = client.get("/api/tickets/my?page=1&limit=2", headers=auth_headers(token))
    assert r.status_code == 200
    body = r.json()
    assert len(body["items"]) == 2
    assert body["pages"] >= 2


# ── update status ─────────────────────────────────────────────────────────────

def test_update_status_as_operator(client):
    ticket_id = _create_ticket(client).json()["id"]
    token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    r = client.patch(f"/api/tickets/{ticket_id}/status",
                     json={"status": "done"}, headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["status"] == "done"


def test_update_status_unauthorized(client):
    ticket_id = _create_ticket(client).json()["id"]
    token = register_and_login(client, "u@test.com", "User", "pass", "user")
    r = client.patch(f"/api/tickets/{ticket_id}/status",
                     json={"status": "done"}, headers=auth_headers(token))
    assert r.status_code == 403


def test_update_status_not_found(client):
    token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    r = client.patch("/api/tickets/TK-9999/status",
                     json={"status": "done"}, headers=auth_headers(token))
    assert r.status_code == 404


# ── assign ────────────────────────────────────────────────────────────────────

def test_assign_ticket(client):
    ticket_id = _create_ticket(client).json()["id"]
    op_token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    # get operator id
    me = client.get("/api/auth/me", headers=auth_headers(op_token)).json()
    r = client.patch(f"/api/tickets/{ticket_id}/assign",
                     json={"operator_id": me["id"]}, headers=auth_headers(op_token))
    assert r.status_code == 200
    assert r.json()["operator_id"] == me["id"]
    assert r.json()["status"] == "progress"


def test_assign_invalid_operator(client):
    ticket_id = _create_ticket(client).json()["id"]
    op_token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    user_token = register_and_login(client, "u@test.com", "User", "pass", "user")
    user_id = client.get("/api/auth/me", headers=auth_headers(user_token)).json()["id"]
    r = client.patch(f"/api/tickets/{ticket_id}/assign",
                     json={"operator_id": user_id}, headers=auth_headers(op_token))
    assert r.status_code == 400


def test_assign_nonexistent_ticket(client):
    op_token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    op_id = client.get("/api/auth/me", headers=auth_headers(op_token)).json()["id"]
    r = client.patch("/api/tickets/TK-9999/assign",
                     json={"operator_id": op_id}, headers=auth_headers(op_token))
    assert r.status_code == 404


# ── reply ─────────────────────────────────────────────────────────────────────

def test_reply_as_user(client):
    user_token = register_and_login(client, "u@test.com", "User", "pass", "user")
    ticket_id = client.post("/api/tickets", json={
        "title": "T", "description": "D",
        "request_type": "technical", "priority": "auto"
    }, headers=auth_headers(user_token)).json()["id"]
    r = client.post(f"/api/tickets/{ticket_id}/reply",
                    json={"content": "Hello from user"}, headers=auth_headers(user_token))
    assert r.status_code == 201
    assert r.json()["content"] == "Hello from user"
    assert r.json()["is_operator"] is False


def test_reply_as_operator_changes_status(client):
    ticket_id = _create_ticket(client).json()["id"]
    op_token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    client.post(f"/api/tickets/{ticket_id}/reply",
                json={"content": "Operator reply"}, headers=auth_headers(op_token))
    r = client.get(f"/api/tickets/{ticket_id}")
    assert r.json()["status"] == "progress"


def test_reply_ticket_not_found(client):
    user_token = register_and_login(client, "u@test.com", "User", "pass", "user")
    r = client.post("/api/tickets/TK-9999/reply",
                    json={"content": "x"}, headers=auth_headers(user_token))
    assert r.status_code == 404


def test_reply_unauthenticated(client):
    ticket_id = _create_ticket(client).json()["id"]
    r = client.post(f"/api/tickets/{ticket_id}/reply", json={"content": "x"})
    assert r.status_code == 401
