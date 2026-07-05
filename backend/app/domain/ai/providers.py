from typing import Protocol

from app.domain.ai.entities import AIProviderConfig, LLMJsonRequest


class LLMProvider(Protocol):
    def generate_json(self, request: LLMJsonRequest) -> dict[str, object]: ...


class LLMProviderFactory(Protocol):
    def create(self, config: AIProviderConfig) -> LLMProvider: ...
