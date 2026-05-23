"""Tests for /api/dashboard endpoint."""
import pytest
from tests.conftest import register_and_login, auth_headers


def test_dashboard_requires_auth(client):
    r = client.get("/api/dashboard")
    assert r.status_code == 401


def test_dashboard_user_forbidden(client):
    token = register_and_login(client, "u@test.com", "User", "pass", "user")
    r = client.get("/api/dashboard", headers=auth_headers(token))
    assert r.status_code == 403


def test_dashboard_as_operator(client):
    token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    r = client.get("/api/dashboard", headers=auth_headers(token))
    assert r.status_code == 200
    body = r.json()
    assert "stats" in body
    assert "categories" in body
    assert "week_data" in body
    assert "week_days" in body
    assert "operators" in body


def test_dashboard_stats_shape(client):
    token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    r = client.get("/api/dashboard", headers=auth_headers(token))
    stats = r.json()["stats"]
    assert len(stats) == 4
    for stat in stats:
        assert "label" in stat
        assert "value" in stat
        assert "sub" in stat


def test_dashboard_week_data_length(client):
    token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    r = client.get("/api/dashboard", headers=auth_headers(token))
    body = r.json()
    assert len(body["week_data"]) == 7
    assert len(body["week_days"]) == 7


def test_dashboard_empty_categories_uses_defaults(client):
    token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    r = client.get("/api/dashboard", headers=auth_headers(token))
    # with no tickets, should return default category data
    categories = r.json()["categories"]
    assert len(categories) >= 1


def test_dashboard_with_tickets(client):
    op_token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    # create some tickets
    for _ in range(3):
        client.post("/api/tickets", json={
            "title": "T", "description": "D",
            "request_type": "technical", "priority": "high"
        })
    r = client.get("/api/dashboard", headers=auth_headers(op_token))
    assert r.status_code == 200
    body = r.json()
    total_stat = body["stats"][0]
    assert int(total_stat["value"]) >= 3


def test_dashboard_operator_load(client):
    op_token = register_and_login(client, "op@test.com", "Test Op", "pass", "operator")
    r = client.get("/api/dashboard", headers=auth_headers(op_token))
    operators = r.json()["operators"]
    assert len(operators) >= 1
    op = next(o for o in operators if o["name"] == "Test Op")
    assert op["active_tickets"] >= 0
