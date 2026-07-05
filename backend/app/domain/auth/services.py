from collections.abc import Mapping
from datetime import UTC, datetime
import re
from uuid import uuid4

from app.core.config import Settings
from app.core.errors import AuthenticationError, ConflictError, PermissionDeniedError, ValidationError
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.domain.auth.entities import AuthToken, User
from app.domain.auth.repositories import AuthRepository

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_-]{3,40}$")
MIN_PASSWORD_LENGTH = 8


def _now() -> datetime:
    return datetime.now(UTC)


def _make_id() -> str:
    return f"user-{uuid4()}"


def _clean_email(value: object) -> str:
    if not isinstance(value, str):
        raise ValidationError("email must be a string")
    email = value.strip().lower()
    if not email:
        raise ValidationError("email is required")
    if len(email) > 254 or not EMAIL_PATTERN.fullmatch(email):
        raise ValidationError("email is invalid")
    return email


def _clean_username(value: object) -> str:
    if not isinstance(value, str):
        raise ValidationError("username must be a string")
    username = value.strip().lower()
    if not username:
        raise ValidationError("username is required")
    if not USERNAME_PATTERN.fullmatch(username):
        raise ValidationError("username must be 3-40 characters using letters, numbers, underscore, or dash")
    return username


def _clean_password(value: object) -> str:
    if not isinstance(value, str):
        raise ValidationError("password must be a string")
    if len(value) < MIN_PASSWORD_LENGTH:
        raise ValidationError("password must be at least 8 characters")
    return value


def _clean_display_name(value: object, fallback: str) -> str:
    if value is None:
        return fallback
    if not isinstance(value, str):
        raise ValidationError("display name must be a string")
    display_name = value.strip()
    if not display_name:
        return fallback
    if len(display_name) > 120:
        raise ValidationError("display name must be 120 characters or fewer")
    return display_name


def _clean_identifier(value: object) -> str:
    if not isinstance(value, str):
        raise ValidationError("identifier must be a string")
    identifier = value.strip()
    if not identifier:
        raise ValidationError("identifier is required")
    return identifier


class AuthService:
    def __init__(self, repository: AuthRepository, settings: Settings) -> None:
        self._repository = repository
        self._settings = settings

    def registration_status(self) -> bool:
        return self._settings.public_registration_enabled

    def register(self, data: Mapping[str, object]) -> User:
        if not self._settings.public_registration_enabled:
            raise PermissionDeniedError("public registration is disabled")

        email = _clean_email(data.get("email"))
        username = _clean_username(data.get("username"))
        password = _clean_password(data.get("password"))
        display_name = _clean_display_name(data.get("display_name"), username)

        if self._repository.get_user_by_email(email) is not None:
            raise ConflictError("email is already registered")
        if self._repository.get_user_by_username(username) is not None:
            raise ConflictError("username is already registered")

        now = _now()
        user = User(
            id=_make_id(),
            email=email,
            username=username,
            display_name=display_name,
            password_hash=hash_password(password),
            created_at=now,
            updated_at=now,
        )
        return self._repository.create_user(user)

    def login(self, data: Mapping[str, object]) -> AuthToken:
        identifier = _clean_identifier(data.get("identifier"))
        password = _clean_password(data.get("password"))

        user = self._get_user_by_identifier(identifier)
        if user is None or not verify_password(password, user.password_hash):
            raise AuthenticationError("invalid credentials")

        expires_in_seconds = self._settings.jwt_access_token_expire_minutes * 60
        access_token = create_access_token(
            subject=user.id,
            secret_key=self._settings.jwt_secret_key,
            algorithm=self._settings.jwt_algorithm,
            expires_in_minutes=self._settings.jwt_access_token_expire_minutes,
        )
        return AuthToken(
            access_token=access_token,
            token_type="bearer",
            expires_in_seconds=expires_in_seconds,
            user=user,
        )

    def get_user_from_token(self, token: str) -> User:
        user_id = decode_access_token(
            token=token,
            secret_key=self._settings.jwt_secret_key,
            algorithm=self._settings.jwt_algorithm,
        )
        user = self._repository.get_user_by_id(user_id)
        if user is None:
            raise AuthenticationError()
        return user

    def _get_user_by_identifier(self, identifier: str) -> User | None:
        if "@" in identifier:
            return self._repository.get_user_by_email(identifier.lower())
        return self._repository.get_user_by_username(identifier.lower())
