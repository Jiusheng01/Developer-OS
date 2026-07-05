from fastapi.testclient import TestClient


def test_dashboard_business_endpoints_require_auth(client: TestClient) -> None:
    for path in ["/api/v1/todos", "/api/v1/learning-items", "/api/v1/notes", "/api/v1/goals"]:
        response = client.get(path)
        assert response.status_code == 401
        assert response.headers["www-authenticate"] == "Bearer"


def test_dashboard_data_is_scoped_to_current_user(
    client: TestClient,
    auth_headers: dict[str, str],
    other_auth_headers: dict[str, str],
) -> None:
    todo = client.post("/api/v1/todos", json={"title": "Owner todo"}, headers=auth_headers).json()
    learning = client.post("/api/v1/learning-items", json={"title": "Owner learning"}, headers=auth_headers).json()
    note = client.post("/api/v1/notes", json={"title": "Owner note"}, headers=auth_headers).json()
    goal = client.post("/api/v1/goals", json={"title": "Owner goal"}, headers=auth_headers).json()
    task = client.post(
        f"/api/v1/goals/{goal['id']}/tasks",
        json={"title": "Owner task"},
        headers=auth_headers,
    ).json()

    assert client.get("/api/v1/todos", headers=other_auth_headers).json() == []
    assert client.get("/api/v1/learning-items", headers=other_auth_headers).json() == []
    assert client.get("/api/v1/notes", headers=other_auth_headers).json() == []
    assert client.get("/api/v1/goals", headers=other_auth_headers).json() == []

    assert client.patch(f"/api/v1/todos/{todo['id']}", json={"done": True}, headers=other_auth_headers).status_code == 404
    assert client.delete(f"/api/v1/todos/{todo['id']}", headers=other_auth_headers).status_code == 404

    assert (
        client.patch(
            f"/api/v1/learning-items/{learning['id']}",
            json={"progress": 20},
            headers=other_auth_headers,
        ).status_code
        == 404
    )
    assert client.delete(f"/api/v1/learning-items/{learning['id']}", headers=other_auth_headers).status_code == 404

    assert client.patch(f"/api/v1/notes/{note['id']}", json={"body": "stolen"}, headers=other_auth_headers).status_code == 404
    assert client.delete(f"/api/v1/notes/{note['id']}", headers=other_auth_headers).status_code == 404

    assert client.patch(f"/api/v1/goals/{goal['id']}", json={"progress": 99}, headers=other_auth_headers).status_code == 404
    assert client.delete(f"/api/v1/goals/{goal['id']}", headers=other_auth_headers).status_code == 404

    assert (
        client.post(
            f"/api/v1/goals/{goal['id']}/tasks",
            json={"title": "stolen"},
            headers=other_auth_headers,
        ).status_code
        == 404
    )
    assert (
        client.patch(
            f"/api/v1/goals/{goal['id']}/tasks/{task['id']}",
            json={"done": True},
            headers=other_auth_headers,
        ).status_code
        == 404
    )
    assert client.delete(f"/api/v1/goals/{goal['id']}/tasks/{task['id']}", headers=other_auth_headers).status_code == 404

    assert [item["id"] for item in client.get("/api/v1/todos", headers=auth_headers).json()] == [todo["id"]]
    assert [item["id"] for item in client.get("/api/v1/learning-items", headers=auth_headers).json()] == [
        learning["id"]
    ]
    assert [item["id"] for item in client.get("/api/v1/notes", headers=auth_headers).json()] == [note["id"]]
    assert [item["id"] for item in client.get("/api/v1/goals", headers=auth_headers).json()] == [goal["id"]]
