from fastapi.testclient import TestClient

from app.core.config import get_settings


def register_user(
    client: TestClient,
    *,
    email: str = "dev@example.com",
    username: str = "devuser",
    password: str = "strong-password",
    display_name: str = "Developer",
):
    return client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "username": username,
            "password": password,
            "displayName": display_name,
        },
    )


def login_user(
    client: TestClient,
    *,
    identifier: str = "dev@example.com",
    password: str = "strong-password",
):
    return client.post("/api/v1/auth/login", json={"identifier": identifier, "password": password})


def test_registration_status_defaults_to_enabled(client: TestClient) -> None:
    response = client.get("/api/v1/auth/registration-status")

    assert response.status_code == 200
    assert response.json() == {"publicRegistrationEnabled": True}


def test_register_login_and_me_flow(client: TestClient) -> None:
    register_response = register_user(client, username="DevUser")
    assert register_response.status_code == 201
    user = register_response.json()
    assert user["id"].startswith("user-")
    assert user["email"] == "dev@example.com"
    assert user["username"] == "devuser"
    assert user["displayName"] == "Developer"
    assert "passwordHash" not in user

    login_response = login_user(client, identifier="devuser")
    assert login_response.status_code == 200
    token = login_response.json()
    assert token["tokenType"] == "bearer"
    assert token["expiresInSeconds"] == 3600
    assert token["accessToken"]
    assert token["user"]["id"] == user["id"]

    me_response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token['accessToken']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["id"] == user["id"]


def test_duplicate_email_and_username_return_409(client: TestClient) -> None:
    assert register_user(client).status_code == 201

    duplicate_email = register_user(client, username="another")
    assert duplicate_email.status_code == 409
    assert duplicate_email.json()["detail"] == "email is already registered"

    duplicate_username = register_user(client, email="another@example.com")
    assert duplicate_username.status_code == 409
    assert duplicate_username.json()["detail"] == "username is already registered"


def test_disabled_public_registration_returns_403(client: TestClient) -> None:
    settings = get_settings()
    original = settings.public_registration_enabled
    settings.public_registration_enabled = False
    try:
        response = register_user(client)
    finally:
        settings.public_registration_enabled = original

    assert response.status_code == 403
    assert response.json()["detail"] == "public registration is disabled"


def test_invalid_credentials_return_401(client: TestClient) -> None:
    assert register_user(client).status_code == 201

    response = login_user(client, password="wrong-password")

    assert response.status_code == 401
    assert response.json()["detail"] == "invalid credentials"


def test_me_requires_valid_bearer_token(client: TestClient) -> None:
    missing_response = client.get("/api/v1/auth/me")
    assert missing_response.status_code == 401
    assert missing_response.headers["www-authenticate"] == "Bearer"

    invalid_response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid"})
    assert invalid_response.status_code == 401
    assert invalid_response.json()["detail"] == "invalid authentication credentials"
