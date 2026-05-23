"""Unit tests for auth module functions."""
import pytest
from auth import hash_password, verify_password, create_access_token, _decode_token


def test_hash_password_returns_bcrypt_hash():
    h = hash_password("mysecret")
    assert h.startswith("$2b$")


def test_verify_password_correct():
    h = hash_password("correctpass")
    assert verify_password("correctpass", h) is True


def test_verify_password_wrong():
    h = hash_password("correctpass")
    assert verify_password("wrongpass", h) is False


def test_create_access_token_returns_non_empty_string():
    token = create_access_token("user-id-123")
    assert isinstance(token, str) and len(token) > 0


def test_decode_valid_token_returns_user_id():
    token = create_access_token("user-id-abc")
    assert _decode_token(token) == "user-id-abc"


def test_decode_invalid_token_returns_none():
    assert _decode_token("not.a.valid.jwt") is None


def test_decode_empty_string_returns_none():
    assert _decode_token("") is None


def test_decode_tampered_token_returns_none():
    token = create_access_token("user-123")
    tampered = token[:-5] + "XXXXX"
    assert _decode_token(tampered) is None
