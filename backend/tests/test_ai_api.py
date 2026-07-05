from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.deps import get_ai_planner_service, get_db_session
from app.domain.ai.entities import AIProviderConfig, LLMJsonRequest
from app.domain.ai.providers import LLMProvider
from app.domain.ai.services import AIPlannerService
from app.infrastructure.repositories.sqlalchemy_ai_repository import SQLAlchemyAIRepository


class FakePlannerProvider:
    def generate_json(self, request: LLMJsonRequest) -> dict[str, object]:
        assert request.model == "gpt-test"
        return {
            "title": "FastAPI AI Planner",
            "summary": "A structured plan generated for execution.",
            "goals": [{"title": "Ship an AI planner", "targetYear": "2026"}],
            "learningItems": [
                {
                    "title": "FastAPI service boundaries",
                    "area": "Backend",
                    "status": "active",
                    "progress": 15,
                    "notes": "Study dependency and repository boundaries.",
                    "tags": ["fastapi", "architecture"],
                }
            ],
            "todos": [{"title": "Draft planner schema", "priority": "high", "tags": ["ai"]}],
            "notePrompts": [
                {
                    "title": "Daily learning reflection",
                    "category": "Learning",
                    "prompt": "What did you finish and where did you get blocked?",
                    "tags": ["reflection"],
                }
            ],
        }


class FakePlannerProviderFactory:
    def create(self, config: AIProviderConfig) -> LLMProvider:
        assert config.provider_type == "openai_compatible"
        return FakePlannerProvider()


def provider_payload(**overrides):
    payload = {
        "providerType": "openai_compatible",
        "displayName": "OpenAI Compatible",
        "baseUrl": "https://api.example.com/v1",
        "apiKey": "secret-key",
        "model": "gpt-test",
        "enabled": True,
    }
    payload.update(overrides)
    return payload


def test_ai_providers_require_auth(client: TestClient) -> None:
    response = client.get("/api/v1/ai/providers")

    assert response.status_code == 401


def test_create_and_list_ai_provider_masks_api_key(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_response = client.post("/api/v1/ai/providers", json=provider_payload(), headers=auth_headers)

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"].startswith("ai-provider-")
    assert created["displayName"] == "OpenAI Compatible"
    assert created["baseUrl"] == "https://api.example.com/v1"
    assert created["model"] == "gpt-test"
    assert created["isDefault"] is True
    assert created["hasApiKey"] is True
    assert "apiKey" not in created

    list_response = client.get("/api/v1/ai/providers", headers=auth_headers)
    assert list_response.status_code == 200
    listed = list_response.json()
    assert len(listed) == 1
    assert listed[0]["id"] == created["id"]
    assert "apiKey" not in listed[0]


def test_ai_provider_user_isolation(
    client: TestClient,
    auth_headers: dict[str, str],
    other_auth_headers: dict[str, str],
) -> None:
    create_response = client.post("/api/v1/ai/providers", json=provider_payload(), headers=auth_headers)
    assert create_response.status_code == 201
    provider_id = create_response.json()["id"]

    other_list = client.get("/api/v1/ai/providers", headers=other_auth_headers)
    assert other_list.status_code == 200
    assert other_list.json() == []

    other_delete = client.delete(f"/api/v1/ai/providers/{provider_id}", headers=other_auth_headers)
    assert other_delete.status_code == 404


def test_invalid_ai_provider_config_returns_400(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.post(
        "/api/v1/ai/providers",
        json=provider_payload(baseUrl="not-a-url"),
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "base_url must be a valid http or https URL"


def test_planner_returns_setup_required_without_default_provider(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.post(
        "/api/v1/ai/planner/generate",
        json={
            "target": "Learn FastAPI AI planning",
            "currentLevel": "Beginner backend developer",
            "weeklyHours": 6,
            "preferredStack": ["FastAPI", "SQLAlchemy"],
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "AI provider setup required"


def test_planner_generates_structured_draft_with_provider_boundary(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    def get_fake_planner_service(session: Session = Depends(get_db_session)) -> AIPlannerService:
        return AIPlannerService(SQLAlchemyAIRepository(session), FakePlannerProviderFactory())

    client.app.dependency_overrides[get_ai_planner_service] = get_fake_planner_service
    try:
        create_response = client.post("/api/v1/ai/providers", json=provider_payload(), headers=auth_headers)
        assert create_response.status_code == 201

        response = client.post(
            "/api/v1/ai/planner/generate",
            json={
                "target": "Become an AI application developer",
                "currentLevel": "Can build small Python apps",
                "deadline": "2026-12-31",
                "weeklyHours": 8,
                "preferredStack": ["FastAPI", "PostgreSQL"],
                "constraints": "Keep it practical.",
            },
            headers=auth_headers,
        )
    finally:
        client.app.dependency_overrides.pop(get_ai_planner_service, None)

    assert response.status_code == 200
    draft = response.json()
    assert draft["id"].startswith("ai-plan-")
    assert draft["title"] == "FastAPI AI Planner"
    assert draft["status"] == "draft"
    assert draft["goals"][0]["title"] == "Ship an AI planner"
    assert draft["learningItems"][0]["title"] == "FastAPI service boundaries"
    assert draft["todos"][0]["priority"] == "high"
    assert draft["notePrompts"][0]["category"] == "Learning"
