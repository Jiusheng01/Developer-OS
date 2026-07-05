from fastapi import APIRouter, Depends, Response, status

from app.api.deps import get_current_user, get_dashboard_service
from app.domain.auth.entities import User
from app.domain.dashboard.services import DashboardService
from app.schemas.notes import NoteCreate, NoteRead, NoteUpdate

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("", response_model=list[NoteRead])
def list_notes(
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> list[NoteRead]:
    return [NoteRead.from_entity(note) for note in service.list_notes(current_user.id)]


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> NoteRead:
    note = service.create_note(current_user.id, payload.model_dump(exclude_unset=True))
    return NoteRead.from_entity(note)


@router.patch("/{note_id}", response_model=NoteRead)
def update_note(
    note_id: str,
    payload: NoteUpdate,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> NoteRead:
    note = service.update_note(current_user.id, note_id, payload.model_dump(exclude_unset=True))
    return NoteRead.from_entity(note)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: str,
    service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
) -> Response:
    service.delete_note(current_user.id, note_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
