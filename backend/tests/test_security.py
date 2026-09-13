"""
Unit tests for Argon2id hashing, JWT token creation, and validation
"""

import pytest
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    UserRole,
)


def test_argon2id_password_hashing():
    pwd = "SecurePassword@2026"
    h = hash_password(pwd)
    assert h.startswith("$argon2id$")
    assert verify_password(pwd, h) is True
    assert verify_password("WrongPassword", h) is False


def test_jwt_access_token():
    token = create_access_token(subject="user-1234", role=UserRole.ADMIN.value)
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "user-1234"
    assert payload["role"] == "ADMIN"
    assert payload["type"] == "access"


def test_jwt_refresh_token():
    raw_token, token_hash, expires_at = create_refresh_token(subject="user-5678")
    assert len(raw_token) > 20
    assert len(token_hash) == 64  # SHA-256 hex string
    payload = decode_token(raw_token)
    assert payload is not None
    assert payload["sub"] == "user-5678"
    assert payload["type"] == "refresh"
