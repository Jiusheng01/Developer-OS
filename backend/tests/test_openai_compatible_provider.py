from datetime import UTC, datetime
from io import BytesIO
from urllib.error import HTTPError

import pytest

from app.core.errors import ValidationError
from app.domain.ai.entities import AIProviderConfig, LLMJsonRequest
from app.infrastructure.ai import openai_compatible
from app.infrastructure.ai.openai_compatible import OpenAICompatibleProvider


def provider_config() -> AIProviderConfig:
    now = datetime.now(UTC)
    return AIProviderConfig(
        id="provider-test",
        user_id="user-test",
        provider_type="openai_compatible",
        display_name="Test Provider",
        base_url="https://api.example.com/v1",
        api_key="sk-secret-should-not-leak",
        model="gpt-test",
        enabled=True,
        is_default=True,
        created_at=now,
        updated_at=now,
    )


def json_request() -> LLMJsonRequest:
    return LLMJsonRequest(
        model="gpt-test",
        system_prompt="Return JSON.",
        user_prompt="Return a plan.",
    )


def test_openai_compatible_provider_maps_403_to_actionable_safe_error(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_urlopen(*_: object, **__: object) -> object:
        raise HTTPError(
            url="https://api.example.com/v1/chat/completions",
            code=403,
            msg="Forbidden",
            hdrs={},
            fp=BytesIO(b'{"error":"forbidden"}'),
        )

    monkeypatch.setattr(openai_compatible, "urlopen", fake_urlopen)
    provider = OpenAICompatibleProvider(provider_config())

    with pytest.raises(ValidationError) as exc_info:
        provider.generate_json(json_request())

    message = exc_info.value.message
    assert "access was forbidden" in message
    assert "API Key permissions" in message
    assert "sk-secret-should-not-leak" not in message
