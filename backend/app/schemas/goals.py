from typing import Literal

from pydantic import Field

from app.domain.dashboard.entities import Goal, GoalTask
from app.schemas.common import APIModel

GoalStatus = Literal["planned", "active", "done"]


class GoalCreate(APIModel):
    title: str
    progress: int = 0
    status: GoalStatus = "planned"
    target_year: str | None = Field(default=None, alias="targetYear")


class GoalUpdate(APIModel):
    title: str | None = None
    progress: int | None = None
    status: GoalStatus | None = None
    target_year: str | None = Field(default=None, alias="targetYear")


class GoalTaskCreate(APIModel):
    title: str


class GoalTaskUpdate(APIModel):
    title: str | None = None
    done: bool | None = None


class GoalTaskRead(APIModel):
    id: str
    title: str
    done: bool

    @classmethod
    def from_entity(cls, task: GoalTask) -> "GoalTaskRead":
        return cls(id=task.id, title=task.title, done=task.done)


class GoalRead(APIModel):
    id: str
    title: str
    progress: int
    status: GoalStatus
    target_year: str | None = Field(alias="targetYear")
    tasks: list[GoalTaskRead]

    @classmethod
    def from_entity(cls, goal: Goal) -> "GoalRead":
        return cls(
            id=goal.id,
            title=goal.title,
            progress=goal.progress,
            status=goal.status,
            target_year=goal.target_year,
            tasks=[GoalTaskRead.from_entity(task) for task in goal.tasks],
        )