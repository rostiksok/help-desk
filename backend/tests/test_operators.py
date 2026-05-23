"""Tests for /api/operators endpoints."""
import pytest
from tests.conftest import register_and_login, auth_headers


def test_list_operators_requires_auth(client):
    r = client.get("/api/operators")
    assert r.status_code == 401


def test_list_operators_user_forbidden(client):
    token = register_and_login(client, "u@test.com", "User", "pass", "user")
    r = client.get("/api/operators", headers=auth_headers(token))
    assert r.status_code == 403


def test_list_operators_as_operator(client):
    token = register_and_login(client, "op@test.com", "Op User", "pass", "operator")
    r = client.get("/api/operators", headers=auth_headers(token))
    assert r.status_code == 200
    ops = r.json()
    assert isinstance(ops, list)
    assert len(ops) >= 1
    first = ops[0]
    assert "id" in first
    assert "name" in first
    assert "initials" in first
    assert "active_tickets" in first


def test_list_operators_returns_initials(client):
    token = register_and_login(client, "op@test.com", "John Doe", "pass", "operator")
    r = client.get("/api/operators", headers=auth_headers(token))
    ops = r.json()
    op = next(o for o in ops if o["name"] == "John Doe")
    assert op["initials"] == "JD"


def test_list_operators_multiple(client):
    token1 = register_and_login(client, "op1@test.com", "Op One", "pass", "operator")
    register_and_login(client, "op2@test.com", "Op Two", "pass", "operator")
    r = client.get("/api/operators", headers=auth_headers(token1))
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_create_operator_requires_admin(client):
    token = register_and_login(client, "op@test.com", "Op", "pass", "operator")
    r = client.post("/api/operators", json={
        "email": "new@test.com", "name": "New Op", "password": "pass", "role": "operator"
    }, headers=auth_headers(token))
    assert r.status_code == 403


def test_create_operator_as_admin(client):
    admin_token = register_and_login(client, "admin@test.com", "Admin", "pass", "admin")
    r = client.post("/api/operators", json={
        "email": "newop@test.com", "name": "New Op", "password": "pass", "role": "operator"
    }, headers=auth_headers(admin_token))
    assert r.status_code == 201
    assert r.json()["role"] == "operator"


def test_create_operator_duplicate_email(client):
    admin_token = register_and_login(client, "admin@test.com", "Admin", "pass", "admin")
    payload = {"email": "op@test.com", "name": "Op", "password": "pass", "role": "operator"}
    client.post("/api/operators", json=payload, headers=auth_headers(admin_token))
    r = client.post("/api/operators", json=payload, headers=auth_headers(admin_token))
    assert r.status_code == 400
