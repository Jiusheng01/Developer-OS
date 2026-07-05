import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.errors import ValidationError
from app.domain.ai.entities import AIProviderConfig, LLMJsonRequest
from app.domain.ai.providers import LLMProvider


class OpenAICompatibleProvider:
    def __init__(self, config: AIProviderConfig, timeout_seconds: int = 60) -> None:
        self._config = config
        self._timeout_seconds = timeout_seconds

    def generate_json(self, request: LLMJsonRequest) -> dict[str, object]:
        payload = {
            "model": request.model,
            "messages": [
                {"role": "system", "content": request.system_prompt},
                {"role": "user", "content": request.user_prompt},
            ],
            "response_format": {"type": "json_object"},
        }
        http_request = Request(
            f"{self._config.base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self._config.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urlopen(http_request, timeout=self._timeout_seconds) as response:
                response_payload = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            raise ValidationError(f"LLM provider request failed with status {exc.code}") from exc
        except (URLError, TimeoutError) as exc:
            raise ValidationError("LLM provider request failed") from exc
        except json.JSONDecodeError as exc:
            raise ValidationError("LLM provider returned invalid JSON") from exc

        return self._extract_json_content(response_payload)

    @staticmethod
    def _extract_json_content(payload: object) -> dict[str, object]:
        if not isinstance(payload, dict):
            raise ValidationError("LLM provider returned invalid response")
        choices = payload.get("choices")
        if not isinstance(choices, list) or not choices:
            raise ValidationError("LLM provider returned no choices")
        first_choice = choices[0]
        if not isinstance(first_choice, dict):
            raise ValidationError("LLM provider returned invalid choice")
        message = first_choice.get("message")
        if not isinstance(message, dict):
            raise ValidationError("LLM provider returned invalid message")
        content = message.get("content")
        if not isinstance(content, str):
            raise ValidationError("LLM provider returned non-text content")
        try:
            plan = json.loads(content)
        except json.JSONDecodeError as exc:
            raise ValidationError("LLM provider returned non-JSON plan") from exc
        if not isinstance(plan, dict):
            raise ValidationError("LLM provider returned invalid plan")
        return {str(key): value for key, value in plan.items()}


class OpenAICompatibleProviderFactory:
    def create(self, config: AIProviderConfig) -> LLMProvider:
        if config.provider_type != "openai_compatible":
            raise ValidationError("provider_type is not supported")
        return OpenAICompatibleProvider(config)
