from fastapi.testclient import TestClient


def test_goal_task_flow_and_progress_clamp(client: TestClient) -> None:
    goal_response = client.post(
        "/api/v1/goals",
        json={"title": "AI Application Developer", "progress": 180, "status": "active", "targetYear": "2026"},
    )
    assert goal_response.status_code == 201
    goal = goal_response.json()
    assert goal["progress"] == 100
    assert goal["targetYear"] == "2026"
    assert goal["tasks"] == []

    task_response = client.post(
        f"/api/v1/goals/{goal['id']}/tasks",
        json={"title": "Build FastAPI backend"},
    )
    assert task_response.status_code == 201
    task = task_response.json()
    assert task["done"] is False

    update_task_response = client.patch(
        f"/api/v1/goals/{goal['id']}/tasks/{task['id']}",
        json={"done": True},
    )
    assert update_task_response.status_code == 200
    assert update_task_response.json()["done"] is True

    list_response = client.get("/api/v1/goals")
    assert list_response.status_code == 200
    listed_goal = list_response.json()[0]
    assert listed_goal["tasks"][0]["id"] == task["id"]
    assert listed_goal["tasks"][0]["done"] is True