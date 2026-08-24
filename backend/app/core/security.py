from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import timedelta

from argon2.low_level import Type
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from starlette.responses import Response

from app.core.config import Settings
from app.utils.types import Timestamp, ensure_utc, utc_now

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 256

password_hasher = PasswordHash((Argon2Hasher(type=Type.ID),))


@dataclass(frozen=True, slots=True)
class IssuedToken:
    raw_token: str
    token_hash: str
    expires_at: Timestamp


def normalize_email(email: str) -> str:
    normalized = email.strip().lower()
    if (
        not 3 <= len(normalized) <= 320
        or normalized.count("@") != 1
        or " " in normalized
        or normalized.startswith("@")
        or normalized.endswith("@")
    ):
        raise ValueError("invalid email address")
    return normalized


def _validate_password(password: str) -> None:
    if not PASSWORD_MIN_LENGTH <= len(password) <= PASSWORD_MAX_LENGTH:
        raise ValueError(
            f"password must contain between {PASSWORD_MIN_LENGTH} and "
            f"{PASSWORD_MAX_LENGTH} characters"
        )


def hash_password(password: str) -> str:
    _validate_password(password)
    return password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password, password_hash)
    except (TypeError, ValueError):
        return False


def hash_token(raw_token: str) -> str:
    if not raw_token:
        raise ValueError("token cannot be empty")
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def verify_token(raw_token: str, expected_hash: str) -> bool:
    if not raw_token or not expected_hash:
        return False
    return hmac.compare_digest(hash_token(raw_token), expected_hash)


def issue_token(*, lifetime: timedelta, now: Timestamp | None = None) -> IssuedToken:
    if lifetime <= timedelta(0):
        raise ValueError("token lifetime must be positive")
    issued_at = ensure_utc(now or utc_now())
    raw_token = secrets.token_urlsafe(32)
    return IssuedToken(
        raw_token=raw_token,
        token_hash=hash_token(raw_token),
        expires_at=issued_at + lifetime,
    )


def is_token_active(
    *,
    expires_at: Timestamp,
    revoked_at: Timestamp | None = None,
    now: Timestamp | None = None,
) -> bool:
    current_time = ensure_utc(now or utc_now())
    return revoked_at is None and ensure_utc(expires_at) > current_time


def set_session_cookie(response: Response, *, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_cookie_max_age_seconds,
        httponly=settings.session_cookie_httponly,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        domain=settings.session_cookie_domain,
        path="/",
    )


def clear_session_cookie(response: Response, *, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        domain=settings.session_cookie_domain,
        path="/",
    )
