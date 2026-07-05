from fastapi.testclient import TestClient


def test_goal_crud_flow_and_progress_clamp(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_response = client.post(
        "/api/v1/goals",
        json={"title": " AI Application Developer ", "progress": 180, "status": "active", "targetYear": "2026"},
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"].startswith("goal-")
    assert created["title"] == "AI Application Developer"
    assert created["progress"] == 100
    assert created["status"] == "active"
    assert created["targetYear"] == "2026"
    assert created["tasks"] == []

    list_response = client.get("/api/v1/goals", headers=auth_headers)
    assert list_response.status_code == 200
    assert [goal["id"] for goal in list_response.json()] == [created["id"]]

    update_response = client.patch(
        f"/api/v1/goals/{created['id']}",
        json={"progress": -10, "status": "done", "targetYear": "   "},
        headers=auth_headers,
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["title"] == "AI Application Developer"
    assert updated["progress"] == 0
    assert updated["status"] == "done"
    assert updated["targetYear"] is None

    delete_response = client.delete(f"/api/v1/goals/{created['id']}", headers=auth_headers)
    assert delete_response.status_code == 204
    assert client.get("/api/v1/goals", headers=auth_headers).json() == []


def test_goal_task_flow_and_delete(client: TestClient, auth_headers: dict[str, str]) -> None:
    goal_response = client.post("/api/v1/goals", json={"title": "Ship Developer OS"}, headers=auth_headers)
    assert goal_response.status_code == 201
    goal = goal_response.json()

    task_response = client.post(
        f"/api/v1/goals/{goal['id']}/tasks",
        json={"title": " Build FastAPI backend "},
        headers=auth_headers,
    )
    assert task_response.status_code == 201
    task = task_response.json()
    assert task["id"].startswith("goal-task-")
    assert task["title"] == "Build FastAPI backend"
    assert task["done"] is False

    update_task_response = client.patch(
        f"/api/v1/goals/{goal['id']}/tasks/{task['id']}",
        json={"title": "Ship FastAPI backend", "done": True},
        headers=auth_headers,
    )
    assert update_task_response.status_code == 200
    updated_task = update_task_response.json()
    assert updated_task["title"] == "Ship FastAPI backend"
    assert updated_task["done"] is True

    list_response = client.get("/api/v1/goals", headers=auth_headers)
    assert list_response.status_code == 200
    listed_goal = list_response.json()[0]
    assert listed_goal["tasks"][0]["id"] == task["id"]
    assert listed_goal["tasks"][0]["done"] is True

    delete_task_response = client.delete(f"/api/v1/goals/{goal['id']}/tasks/{task['id']}", headers=auth_headers)
    assert delete_task_response.status_code == 204
    assert client.get("/api/v1/goals", headers=auth_headers).json()[0]["tasks"] == []


def test_goal_defaults_and_validation(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post("/api/v1/goals", json={"title": "PostgreSQL migration"}, headers=auth_headers)

    assert response.status_code == 201
    created = response.json()
    assert created["progress"] == 0
    assert created["status"] == "planned"
    assert created["targetYear"] is None
    assert created["tasks"] == []

    blank_goal_response = client.post("/api/v1/goals", json={"title": "   "}, headers=auth_headers)
    assert blank_goal_response.status_code == 400
    assert blank_goal_response.json()["detail"] == "title is required"

    invalid_status_response = client.post(
        "/api/v1/goals",
        json={"title": "Redis", "status": "blocked"},
        headers=auth_headers,
    )
    assert invalid_status_response.status_code == 422

    blank_task_response = client.post(
        f"/api/v1/goals/{created['id']}/tasks",
        json={"title": "   "},
        headers=auth_headers,
    )
    assert blank_task_response.status_code == 400
    assert blank_task_response.json()["detail"] == "title is required"


def test_missing_goal_returns_404(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.patch("/api/v1/goals/missing", json={"progress": 20}, headers=auth_headers)

    assert response.status_code == 404
    assert response.json()["detail"] == {"resource": "goal", "id": "missing"}


def test_missing_goal_task_returns_404(client: TestClient, auth_headers: dict[str, str]) -> None:
    goal_response = client.post("/api/v1/goals", json={"title": "AI Application Developer"}, headers=auth_headers)
    assert goal_response.status_code == 201
    goal = goal_response.json()

    response = client.patch(
        f"/api/v1/goals/{goal['id']}/tasks/missing-task",
        json={"done": True},
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == {"resource": "goal task", "id": "missing-task"}
