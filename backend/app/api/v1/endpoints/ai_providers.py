from fastapi import APIRouter, Depends, Response, status

from app.api.deps import get_ai_provider_service, get_current_user
from app.domain.ai.services import AIProviderService
from app.domain.auth.entities import User
from app.schemas.ai import AIProviderCreate, AIProviderRead, AIProviderTestResultRead, AIProviderUpdate

router = APIRouter(prefix="/ai/providers", tags=["ai-providers"])


@router.get("", response_model=list[AIProviderRead])
def list_ai_providers(
    service: AIProviderService = Depends(get_ai_provider_service),
    current_user: User = Depends(get_current_user),
) -> list[AIProviderRead]:
    return [AIProviderRead.from_entity(config) for config in service.list_provider_configs(current_user.id)]


@router.post("", response_model=AIProviderRead, status_code=status.HTTP_201_CREATED)
def create_ai_provider(
    payload: AIProviderCreate,
    service: AIProviderService = Depends(get_ai_provider_service),
    current_user: User = Depends(get_current_user),
) -> AIProviderRead:
    config = service.create_provider_config(current_user.id, payload.model_dump(by_alias=False, exclude_unset=True))
    return AIProviderRead.from_entity(config)


@router.patch("/{provider_id}", response_model=AIProviderRead)
def update_ai_provider(
    provider_id: str,
    payload: AIProviderUpdate,
    service: AIProviderService = Depends(get_ai_provider_service),
    current_user: User = Depends(get_current_user),
) -> AIProviderRead:
    config = service.update_provider_config(
        current_user.id,
        provider_id,
        payload.model_dump(by_alias=False, exclude_unset=True),
    )
    return AIProviderRead.from_entity(config)


@router.post("/{provider_id}/default", response_model=AIProviderRead)
def set_default_ai_provider(
    provider_id: str,
    service: AIProviderService = Depends(get_ai_provider_service),
    current_user: User = Depends(get_current_user),
) -> AIProviderRead:
    config = service.set_default_provider_config(current_user.id, provider_id)
    return AIProviderRead.from_entity(config)


@router.post("/{provider_id}/test", response_model=AIProviderTestResultRead)
def test_ai_provider(
    provider_id: str,
    service: AIProviderService = Depends(get_ai_provider_service),
    current_user: User = Depends(get_current_user),
) -> AIProviderTestResultRead:
    result = service.test_provider_config(current_user.id, provider_id)
    return AIProviderTestResultRead.from_entity(result)


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ai_provider(
    provider_id: str,
    service: AIProviderService = Depends(get_ai_provider_service),
    current_user: User = Depends(get_current_user),
) -> Response:
    service.delete_provider_config(current_user.id, provider_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
