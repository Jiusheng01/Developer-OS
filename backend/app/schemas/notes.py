from datetime import datetime

from pydantic import Field

from app.domain.dashboard.entities import Note
from app.schemas.common import APIModel


class NoteCreate(APIModel):
    title: str
    body: str = ""
    category: str = "General"
    tags: list[str] = Field(default_factory=list)


class NoteUpdate(APIModel):
    title: str | None = None
    body: str | None = None
    category: str | None = None
    tags: list[str] | None = None


class NoteRead(APIModel):
    id: str
    title: str
    body: str
    category: str
    tags: list[str]
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_entity(cls, note: Note) -> "NoteRead":
        return cls(
            id=note.id,
            title=note.title,
            body=note.body,
            category=note.category,
            tags=note.tags,
            updated_at=note.updated_at,
        )