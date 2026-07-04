from datetime import datetime
from typing import Literal

from pydantic import Field

from app.domain.dashboard.entities import LearningItem
from app.schemas.common import APIModel

LearningStatus = Literal["queued", "active", "review", "done"]


class LearningItemCreate(APIModel):
    title: str
    area: str = "General"
    status: LearningStatus = "queued"
    progress: int = 0
    notes: str = ""
    tags: list[str] = Field(default_factory=list)


class LearningItemUpdate(APIModel):
    title: str | None = None
    area: str | None = None
    status: LearningStatus | None = None
    progress: int | None = None
    notes: str | None = None
    tags: list[str] | None = None


class LearningItemRead(APIModel):
    id: str
    title: str
    area: str
    status: LearningStatus
    progress: int
    notes: str
    tags: list[str]
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_entity(cls, item: LearningItem) -> "LearningItemRead":
        return cls(
            id=item.id,
            title=item.title,
            area=item.area,
            status=item.status,
            progress=item.progress,
            notes=item.notes,
            tags=item.tags,
            updated_at=item.updated_at,
        )