import os

# Set env vars BEFORE any app module is imported
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_helpdesk.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing-only")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:3000")
os.environ.setdefault("ANTHROPIC_API_KEY", "")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from database import engine, Base, get_db
from main import app

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _make_db_override():
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
    return override_get_db


@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = _make_db_override()
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def register_and_login(client: TestClient, email: str, name: str, password: str, role: str) -> str:
    client.post("/api/auth/register", json={
        "email": email, "name": name, "password": password, "role": role
    })
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    return r.json()["access_token"]


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
