from datetime import UTC, datetime
from io import BytesIO
import json
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


def test_openai_compatible_provider_retries_without_response_format(monkeypatch: pytest.MonkeyPatch) -> None:
    requests: list[dict[str, object]] = []

    class FakeResponse:
        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *_: object) -> None:
            return None

        @staticmethod
        def read() -> bytes:
            return json.dumps(
                {
                    "choices": [
                        {
                            "message": {
                                "content": '```json\n{"status":"ok"}\n```',
                            }
                        }
                    ]
                }
            ).encode("utf-8")

    def fake_urlopen(request: object, **__: object) -> object:
        data = getattr(request, "data")
        payload = json.loads(data.decode("utf-8"))
        requests.append(payload)
        if "response_format" in payload:
            raise HTTPError(
                url="https://api.example.com/v1/chat/completions",
                code=400,
                msg="Bad Request",
                hdrs={},
                fp=BytesIO(b'{"error":"response_format unsupported"}'),
            )
        return FakeResponse()

    monkeypatch.setattr(openai_compatible, "urlopen", fake_urlopen)
    provider = OpenAICompatibleProvider(provider_config())

    assert provider.generate_json(json_request()) == {"status": "ok"}
    assert len(requests) == 2
    assert "response_format" in requests[0]
    assert "response_format" not in requests[1]


def test_openai_compatible_provider_accepts_full_chat_completions_url(monkeypatch: pytest.MonkeyPatch) -> None:
    requested_urls: list[str] = []
    config = provider_config()
    config = AIProviderConfig(
        **{
            **config.__dict__,
            "base_url": "https://api.example.com/v1/chat/completions",
        }
    )

    class FakeResponse:
        def __enter__(self) -> "FakeResponse":
            return self

        def __exit__(self, *_: object) -> None:
            return None

        @staticmethod
        def read() -> bytes:
            return json.dumps({"choices": [{"message": {"content": '{"status":"ok"}'}}]}).encode("utf-8")

    def fake_urlopen(request: object, **__: object) -> object:
        requested_urls.append(getattr(request, "full_url"))
        return FakeResponse()

    monkeypatch.setattr(openai_compatible, "urlopen", fake_urlopen)
    provider = OpenAICompatibleProvider(config)

    assert provider.generate_json(json_request()) == {"status": "ok"}
    assert requested_urls == ["https://api.example.com/v1/chat/completions"]
