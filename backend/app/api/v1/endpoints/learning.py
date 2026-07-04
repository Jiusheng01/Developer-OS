from fastapi import APIRouter, Depends, Response, status

from app.api.deps import get_dashboard_service
from app.domain.dashboard.services import DashboardService
from app.schemas.learning import LearningItemCreate, LearningItemRead, LearningItemUpdate

router = APIRouter(prefix="/learning-items", tags=["learning"])


@router.get("", response_model=list[LearningItemRead])
def list_learning_items(
    service: DashboardService = Depends(get_dashboard_service),
) -> list[LearningItemRead]:
    return [LearningItemRead.from_entity(item) for item in service.list_learning_items()]


@router.post("", response_model=LearningItemRead, status_code=status.HTTP_201_CREATED)
def create_learning_item(
    payload: LearningItemCreate,
    service: DashboardService = Depends(get_dashboard_service),
) -> LearningItemRead:
    item = service.create_learning_item(payload.model_dump(exclude_unset=True))
    return LearningItemRead.from_entity(item)


@router.patch("/{item_id}", response_model=LearningItemRead)
def update_learning_item(
    item_id: str,
    payload: LearningItemUpdate,
    service: DashboardService = Depends(get_dashboard_service),
) -> LearningItemRead:
    item = service.update_learning_item(item_id, payload.model_dump(exclude_unset=True))
    return LearningItemRead.from_entity(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_learning_item(
    item_id: str,
    service: DashboardService = Depends(get_dashboard_service),
) -> Response:
    service.delete_learning_item(item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)