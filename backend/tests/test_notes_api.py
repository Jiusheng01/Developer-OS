from fastapi.testclient import TestClient


def test_note_crud_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_response = client.post(
        "/api/v1/notes",
        json={
            "title": " API decision ",
            "body": "Use repository ports.",
            "category": " Architecture ",
            "tags": [" api ", "api", "v2"],
        },
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"].startswith("note-")
    assert created["title"] == "API decision"
    assert created["body"] == "Use repository ports."
    assert created["category"] == "Architecture"
    assert created["tags"] == ["api", "v2"]
    assert isinstance(created["updatedAt"], str)

    list_response = client.get("/api/v1/notes", headers=auth_headers)
    assert list_response.status_code == 200
    assert [note["id"] for note in list_response.json()] == [created["id"]]

    update_response = client.patch(
        f"/api/v1/notes/{created['id']}",
        json={
            "body": "",
            "category": "   ",
            "tags": [" local ", "local", "api"],
        },
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["body"] == ""
    assert updated["category"] == "General"
    assert updated["tags"] == ["local", "api"]

    delete_response = client.delete(f"/api/v1/notes/{created['id']}", headers=auth_headers)
    assert delete_response.status_code == 204
    assert client.get("/api/v1/notes", headers=auth_headers).json() == []


def test_note_defaults_and_validation(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/api/v1/notes", json={"title": "MCP"}, headers=auth_headers)

    assert response.status_code == 201
    created = response.json()
    assert created["body"] == ""
    assert created["category"] == "General"
    assert created["tags"] == []

    blank_response = client.post("/api/v1/notes", json={"title": "   "}, headers=auth_headers)
    assert blank_response.status_code == 400
    assert blank_response.json()["detail"] == "title is required"


def test_missing_note_returns_404(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.patch("/api/v1/notes/missing", json={"body": "later"}, headers=auth_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == {"resource": "note", "id": "missing"}
