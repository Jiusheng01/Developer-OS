from fastapi import APIRouter, Depends, Response, status

from app.api.deps import get_current_user, get_dashboard_service
from app.domain.auth.entities import User
from app.domain.dashboard.services import DashboardService
from app.schemas.todos import TodoCreate, TodoRead, TodoUpdate

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=list[TodoRead])
def list_todos(
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> list[TodoRead]:
    return [TodoRead.from_entity(todo) for todo in service.list_todos(current_user.id)]


@router.post("", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
def create_todo(
    payload: TodoCreate,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> TodoRead:
    todo = service.create_todo(current_user.id, payload.model_dump(exclude_unset=True))
    return TodoRead.from_entity(todo)


@router.patch("/{todo_id}", response_model=TodoRead)
def update_todo(
    todo_id: str,
    payload: TodoUpdate,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> TodoRead:
    todo = service.update_todo(current_user.id, todo_id, payload.model_dump(exclude_unset=True))
    return TodoRead.from_entity(todo)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: str,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> Response:
    service.delete_todo(current_user.id, todo_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
