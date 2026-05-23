"""Tests for /api/auth endpoints."""
import pytest
from tests.conftest import register_and_login, auth_headers


def test_register_success(client):
    r = client.post("/api/auth/register", json={
        "email": "alice@example.com", "name": "Alice", "password": "pass123", "role": "user"
    })
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == "alice@example.com"
    assert data["name"] == "Alice"
    assert data["role"] == "user"
    assert "id" in data


def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "name": "Bob", "password": "pass", "role": "user"}
    client.post("/api/auth/register", json=payload)
    r = client.post("/api/auth/register", json=payload)
    assert r.status_code == 400


def test_register_operator_role(client):
    r = client.post("/api/auth/register", json={
        "email": "op@example.com", "name": "Op", "password": "pass", "role": "operator"
    })
    assert r.status_code == 201
    assert r.json()["role"] == "operator"


def test_login_success(client):
    client.post("/api/auth/register", json={
        "email": "bob@example.com", "name": "Bob", "password": "secret", "role": "user"
    })
    r = client.post("/api/auth/login", json={"email": "bob@example.com", "password": "secret"})
    assert r.status_code == 200
    assert "access_token" in r.json()
    assert r.json()["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "charlie@example.com", "name": "Charlie", "password": "correct", "role": "user"
    })
    r = client.post("/api/auth/login", json={"email": "charlie@example.com", "password": "wrong"})
    assert r.status_code == 401


def test_login_nonexistent_user(client):
    r = client.post("/api/auth/login", json={"email": "ghost@example.com", "password": "any"})
    assert r.status_code == 401


def test_me_authenticated(client):
    token = register_and_login(client, "me@example.com", "Me User", "pass", "user")
    r = client.get("/api/auth/me", headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["email"] == "me@example.com"


def test_me_unauthenticated(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_invalid_token(client):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert r.status_code == 401
