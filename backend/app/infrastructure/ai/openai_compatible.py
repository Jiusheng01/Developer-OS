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
        try:
            response_payload = self._request_json(_chat_payload(request, include_response_format=True))
        except HTTPError as exc:
            if exc.code not in {400, 422}:
                raise ValidationError(_provider_http_error_message(exc.code, _provider_error_detail(exc, self._config.api_key))) from exc
            try:
                response_payload = self._request_json(_chat_payload(request, include_response_format=False))
            except HTTPError as fallback_exc:
                raise ValidationError(
                    _provider_http_error_message(
                        fallback_exc.code,
                        _provider_error_detail(fallback_exc, self._config.api_key),
                    )
                ) from fallback_exc

        return self._extract_json_content(response_payload)

    def _request_json(self, payload: dict[str, object]) -> object:
        http_request = Request(
            _chat_completions_url(self._config.base_url),
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self._config.api_key}",
                "Content-Type": "application/json",
                "User-Agent": "Developer-OS/0.1",
            },
            method="POST",
        )
        try:
            with urlopen(http_request, timeout=self._timeout_seconds) as response:
                response_body = response.read().decode("utf-8", errors="replace")
                return json.loads(response_body)
        except HTTPError:
            raise
        except (URLError, TimeoutError) as exc:
            raise ValidationError("LLM provider is unreachable. Check the Base URL and network access.") from exc
        except json.JSONDecodeError as exc:
            raise ValidationError("LLM provider returned invalid JSON") from exc

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
        content = _message_content_to_text(message.get("content"))
        return _parse_json_object_content(content)


def _chat_payload(request: LLMJsonRequest, *, include_response_format: bool) -> dict[str, object]:
    payload: dict[str, object] = {
        "model": request.model,
        "messages": [
            {"role": "system", "content": request.system_prompt},
            {"role": "user", "content": request.user_prompt},
        ],
    }
    if include_response_format:
        payload["response_format"] = {"type": "json_object"}
    return payload


def _chat_completions_url(base_url: str) -> str:
    stripped = base_url.rstrip("/")
    if stripped.endswith("/chat/completions"):
        return stripped
    return f"{stripped}/chat/completions"


def _message_content_to_text(content: object) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and isinstance(item.get("text"), str):
                text_parts.append(item["text"])
        if text_parts:
            return "\n".join(text_parts)
    raise ValidationError("LLM provider returned non-text content")


def _parse_json_object_content(content: str) -> dict[str, object]:
    decoder = json.JSONDecoder()
    for index, character in enumerate(content):
        if character != "{":
            continue
        try:
            parsed, _ = decoder.raw_decode(content[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(parsed, dict):
            return {str(key): value for key, value in parsed.items()}
    raise ValidationError(f"LLM provider returned non-JSON plan. Provider response: {_safe_snippet(content)}")


class OpenAICompatibleProviderFactory:
    def create(self, config: AIProviderConfig) -> LLMProvider:
        if config.provider_type != "openai_compatible":
            raise ValidationError("provider_type is not supported")
        return OpenAICompatibleProvider(config)


def _provider_http_error_message(status_code: int, provider_detail: str | None = None) -> str:
    if status_code == 400:
        message = "LLM provider rejected the request. Check whether the Base URL points to a chat completions endpoint and whether the model name is valid."
    elif status_code == 401:
        message = "LLM provider authentication failed. Check the API Key."
    elif status_code == 403:
        message = (
            "LLM provider access was forbidden. Check API Key permissions, account status, region access, "
            "and whether the selected model is allowed for this provider."
        )
    elif status_code == 404:
        message = "LLM provider endpoint or model was not found. Check the Base URL and model name."
    elif status_code == 429:
        message = "LLM provider rate limit or quota was exceeded. Check billing, quota, or retry later."
    elif 500 <= status_code <= 599:
        message = "LLM provider is temporarily unavailable. Retry later or choose another provider."
    else:
        message = f"LLM provider request failed with status {status_code}"
    if provider_detail:
        return f"{message} Provider detail: {provider_detail}"
    return message


def _provider_error_detail(exc: HTTPError, api_key: str) -> str | None:
    try:
        raw_body = exc.read().decode("utf-8", errors="replace")
    except Exception:
        return None
    if not raw_body.strip():
        return None
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return _safe_snippet(raw_body, api_key)

    detail_parts = _extract_error_parts(payload)
    if not detail_parts:
        return _safe_snippet(raw_body, api_key)
    return _safe_snippet(" | ".join(detail_parts), api_key)


def _extract_error_parts(value: object) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        parts: list[str] = []
        for item in value:
            parts.extend(_extract_error_parts(item))
        return parts
    if not isinstance(value, dict):
        return []

    parts: list[str] = []
    for key in ("code", "status", "type", "message", "msg", "detail", "request_id", "requestId"):
        item = value.get(key)
        if isinstance(item, str) and item.strip():
            parts.append(f"{key}={item.strip()}")
        elif isinstance(item, (int, float)):
            parts.append(f"{key}={item}")
    for key in ("error", "data"):
        if key in value:
            parts.extend(_extract_error_parts(value[key]))
    return parts


def _safe_snippet(value: str, secret: str | None = None, limit: int = 500) -> str:
    snippet = " ".join(value.strip().split())
    if secret:
        snippet = snippet.replace(secret, "[redacted]")
    if len(snippet) > limit:
        return f"{snippet[:limit]}..."
    return snippet
