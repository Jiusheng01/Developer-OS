from fastapi import APIRouter, Depends

from app.api.deps import get_ai_planner_service, get_current_user
from app.domain.ai.services import AIPlannerService
from app.domain.auth.entities import User
from app.schemas.ai import LearningGoalInputCreate, LearningPlanDraftRead

router = APIRouter(prefix="/ai/planner", tags=["ai-planner"])


@router.post("/generate", response_model=LearningPlanDraftRead)
def generate_learning_plan(
    payload: LearningGoalInputCreate,
    service: AIPlannerService = Depends(get_ai_planner_service),
    current_user: User = Depends(get_current_user),
) -> LearningPlanDraftRead:
    draft = service.generate_plan(current_user.id, payload.model_dump(by_alias=False, exclude_unset=True))
    return LearningPlanDraftRead.from_entity(draft)
