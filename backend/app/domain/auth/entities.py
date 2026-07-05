from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class User:
    id: str
    email: str
    username: str
    display_name: str
    password_hash: str
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class AuthToken:
    access_token: str
    token_type: str
    expires_in_seconds: int
    user: User
