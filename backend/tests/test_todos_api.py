from fastapi.testclient import TestClient


def test_todo_crud_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_response = client.post(
        "/api/v1/todos",
        json={"title": " Ship V2 ", "priority": "high", "tags": [" api ", "api"], "dueDate": "2026-07-10"},
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"].startswith("todo-")
    assert created["title"] == "Ship V2"
    assert created["priority"] == "high"
    assert created["tags"] == ["api"]
    assert created["dueDate"] == "2026-07-10"

    list_response = client.get("/api/v1/todos", headers=auth_headers)
    assert list_response.status_code == 200
    assert [todo["id"] for todo in list_response.json()] == [created["id"]]

    update_response = client.patch(
        f"/api/v1/todos/{created['id']}",
        json={"done": True, "dueDate": None},
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["done"] is True
    assert updated["dueDate"] is None

    delete_response = client.delete(f"/api/v1/todos/{created['id']}", headers=auth_headers)
    assert delete_response.status_code == 204
    assert client.get("/api/v1/todos", headers=auth_headers).json() == []


def test_blank_todo_title_returns_400(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/api/v1/todos", json={"title": "   "}, headers=auth_headers)

    assert response.status_code == 400
    assert response.json()["detail"] == "title is required"


def test_missing_todo_returns_404(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.patch("/api/v1/todos/missing", json={"done": True}, headers=auth_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == {"resource": "todo", "id": "missing"}
