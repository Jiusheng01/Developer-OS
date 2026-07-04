from fastapi import APIRouter, Depends, Response, status

from app.api.deps import get_dashboard_service
from app.domain.dashboard.services import DashboardService
from app.schemas.todos import TodoCreate, TodoRead, TodoUpdate

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=list[TodoRead])
def list_todos(service: DashboardService = Depends(get_dashboard_service)) -> list[TodoRead]:
    return [TodoRead.from_entity(todo) for todo in service.list_todos()]


@router.post("", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
def create_todo(
    payload: TodoCreate,
    service: DashboardService = Depends(get_dashboard_service),
) -> TodoRead:
    todo = service.create_todo(payload.model_dump(exclude_unset=True))
    return TodoRead.from_entity(todo)


@router.patch("/{todo_id}", response_model=TodoRead)
def update_todo(
    todo_id: str,
    payload: TodoUpdate,
    service: DashboardService = Depends(get_dashboard_service),
) -> TodoRead:
    todo = service.update_todo(todo_id, payload.model_dump(exclude_unset=True))
    return TodoRead.from_entity(todo)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: str,
    service: DashboardService = Depends(get_dashboard_service),
) -> Response:
    service.delete_todo(todo_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)