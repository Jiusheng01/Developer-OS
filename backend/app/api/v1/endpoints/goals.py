from fastapi import APIRouter, Depends, Response, status

from app.api.deps import get_current_user, get_dashboard_service
from app.domain.auth.entities import User
from app.domain.dashboard.services import DashboardService
from app.schemas.goals import (
    GoalCreate,
    GoalRead,
    GoalTaskCreate,
    GoalTaskRead,
    GoalTaskUpdate,
    GoalUpdate,
)

router = APIRouter(prefix="/goals", tags=["goals"])


@router.get("", response_model=list[GoalRead])
def list_goals(
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> list[GoalRead]:
    return [GoalRead.from_entity(goal) for goal in service.list_goals(current_user.id)]


@router.post("", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> GoalRead:
    goal = service.create_goal(current_user.id, payload.model_dump(exclude_unset=True))
    return GoalRead.from_entity(goal)


@router.patch("/{goal_id}", response_model=GoalRead)
def update_goal(
    goal_id: str,
    payload: GoalUpdate,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> GoalRead:
    goal = service.update_goal(current_user.id, goal_id, payload.model_dump(exclude_unset=True))
    return GoalRead.from_entity(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: str,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> Response:
    service.delete_goal(current_user.id, goal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{goal_id}/tasks", response_model=GoalTaskRead, status_code=status.HTTP_201_CREATED)
def create_goal_task(
    goal_id: str,
    payload: GoalTaskCreate,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> GoalTaskRead:
    task = service.create_goal_task(current_user.id, goal_id, payload.model_dump(exclude_unset=True))
    return GoalTaskRead.from_entity(task)


@router.patch("/{goal_id}/tasks/{task_id}", response_model=GoalTaskRead)
def update_goal_task(
    goal_id: str,
    task_id: str,
    payload: GoalTaskUpdate,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> GoalTaskRead:
    task = service.update_goal_task(current_user.id, goal_id, task_id, payload.model_dump(exclude_unset=True))
    return GoalTaskRead.from_entity(task)


@router.delete("/{goal_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal_task(
    goal_id: str,
    task_id: str,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> Response:
    service.delete_goal_task(current_user.id, goal_id, task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
