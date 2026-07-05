from fastapi.testclient import TestClient


def test_learning_item_crud_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_response = client.post(
        "/api/v1/learning-items",
        json={
            "title": " FastAPI ",
            "area": "  Backend  ",
            "status": "active",
            "progress": 180,
            "notes": "Repository boundary",
            "tags": [" api ", "api", "sqlalchemy"],
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"].startswith("learning-")
    assert created["title"] == "FastAPI"
    assert created["area"] == "Backend"
    assert created["status"] == "active"
    assert created["progress"] == 100
    assert created["notes"] == "Repository boundary"
    assert created["tags"] == ["api", "sqlalchemy"]
    assert isinstance(created["updatedAt"], str)

    list_response = client.get("/api/v1/learning-items", headers=auth_headers)
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [created["id"]]

    update_response = client.patch(
        f"/api/v1/learning-items/{created['id']}",
        json={
            "area": "   ",
            "status": "review",
            "progress": -10,
            "notes": "",
            "tags": [" review ", "review", "v2"],
        },
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["area"] == "General"
    assert updated["status"] == "review"
    assert updated["progress"] == 0
    assert updated["notes"] == ""
    assert updated["tags"] == ["review", "v2"]

    delete_response = client.delete(f"/api/v1/learning-items/{created['id']}", headers=auth_headers)
    assert delete_response.status_code == 204
    assert client.get("/api/v1/learning-items", headers=auth_headers).json() == []


def test_learning_item_defaults_and_validation(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/api/v1/learning-items", json={"title": "Docker"}, headers=auth_headers)

    assert response.status_code == 201
    created = response.json()
    assert created["area"] == "General"
    assert created["status"] == "queued"
    assert created["progress"] == 0
    assert created["notes"] == ""
    assert created["tags"] == []

    blank_response = client.post("/api/v1/learning-items", json={"title": "   "}, headers=auth_headers)
    assert blank_response.status_code == 400
    assert blank_response.json()["detail"] == "title is required"

    invalid_status_response = client.post(
        "/api/v1/learning-items",
        json={"title": "Redis", "status": "blocked"},
        headers=auth_headers,
    )
    assert invalid_status_response.status_code == 422


def test_missing_learning_item_returns_404(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.patch("/api/v1/learning-items/missing", json={"progress": 20}, headers=auth_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == {"resource": "learning item", "id": "missing"}
