from __future__ import annotations

from datetime import UTC, datetime, timedelta
import base64
import hashlib
import hmac
import secrets

import jwt
from jwt import InvalidTokenError

from app.core.errors import AuthenticationError

PASSWORD_HASH_ALGORITHM = "pbkdf2_sha256"
PASSWORD_HASH_ITERATIONS = 390_000


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_HASH_ITERATIONS,
    )
    return "$".join(
        [
            PASSWORD_HASH_ALGORITHM,
            str(PASSWORD_HASH_ITERATIONS),
            _base64url_encode(salt),
            _base64url_encode(digest),
        ]
    )


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations, encoded_salt, encoded_digest = password_hash.split("$", 3)
        if algorithm != PASSWORD_HASH_ALGORITHM:
            return False
        salt = _base64url_decode(encoded_salt)
        expected = _base64url_decode(encoded_digest)
        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            int(iterations),
        )
    except (TypeError, ValueError):
        return False

    return hmac.compare_digest(actual, expected)


def create_access_token(
    *,
    subject: str,
    secret_key: str,
    algorithm: str,
    expires_in_minutes: int,
) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": subject,
        "iat": now,
        "exp": now + timedelta(minutes=expires_in_minutes),
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def decode_access_token(*, token: str, secret_key: str, algorithm: str) -> str:
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
    except InvalidTokenError as exc:
        raise AuthenticationError() from exc

    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject:
        raise AuthenticationError()
    return subject
