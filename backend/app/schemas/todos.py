from datetime import datetime
from typing import Literal

from pydantic import Field

from app.domain.dashboard.entities import Todo
from app.schemas.common import APIModel

TodoPriority = Literal["low", "medium", "high"]


class TodoCreate(APIModel):
    title: str
    priority: TodoPriority = "medium"
    tags: list[str] = Field(default_factory=list)
    due_date: str | None = Field(default=None, alias="dueDate")


class TodoUpdate(APIModel):
    title: str | None = None
    done: bool | None = None
    priority: TodoPriority | None = None
    tags: list[str] | None = None
    due_date: str | None = Field(default=None, alias="dueDate")


class TodoRead(APIModel):
    id: str
    title: str
    done: bool
    priority: TodoPriority
    tags: list[str]
    due_date: str | None = Field(alias="dueDate")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_entity(cls, todo: Todo) -> "TodoRead":
        return cls(
            id=todo.id,
            title=todo.title,
            done=todo.done,
            priority=todo.priority,
            tags=todo.tags,
            due_date=todo.due_date,
            created_at=todo.created_at,
            updated_at=todo.updated_at,
        )