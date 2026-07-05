from datetime import datetime
from typing import Literal

from pydantic import Field

from app.domain.auth.entities import AuthToken, User
from app.schemas.common import APIModel


class UserRegister(APIModel):
    email: str
    username: str
    password: str
    display_name: str | None = Field(default=None, alias="displayName")


class UserLogin(APIModel):
    identifier: str
    password: str


class UserRead(APIModel):
    id: str
    email: str
    username: str
    display_name: str = Field(alias="displayName")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_entity(cls, user: User) -> "UserRead":
        return cls(
            id=user.id,
            email=user.email,
            username=user.username,
            display_name=user.display_name,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )


class AuthTokenRead(APIModel):
    access_token: str = Field(alias="accessToken")
    token_type: Literal["bearer"] = Field(alias="tokenType")
    expires_in_seconds: int = Field(alias="expiresInSeconds")
    user: UserRead

    @classmethod
    def from_entity(cls, token: AuthToken) -> "AuthTokenRead":
        return cls(
            access_token=token.access_token,
            token_type="bearer",
            expires_in_seconds=token.expires_in_seconds,
            user=UserRead.from_entity(token.user),
        )


class RegistrationStatusRead(APIModel):
    public_registration_enabled: bool = Field(alias="publicRegistrationEnabled")
