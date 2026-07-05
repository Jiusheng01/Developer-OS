from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal, cast

TodoPriority = Literal["low", "medium", "high"]
LearningStatus = Literal["queued", "active", "review", "done"]
GoalStatus = Literal["planned", "active", "done"]

TODO_PRIORITIES = ("low", "medium", "high")
LEARNING_STATUSES = ("queued", "active", "review", "done")
GOAL_STATUSES = ("planned", "active", "done")


def as_todo_priority(value: object) -> TodoPriority:
    return cast(TodoPriority, value) if value in TODO_PRIORITIES else "medium"


def as_learning_status(value: object) -> LearningStatus:
    return cast(LearningStatus, value) if value in LEARNING_STATUSES else "queued"


def as_goal_status(value: object) -> GoalStatus:
    return cast(GoalStatus, value) if value in GOAL_STATUSES else "planned"


@dataclass(frozen=True)
class Todo:
    id: str
    user_id: str
    title: str
    done: bool
    priority: TodoPriority
    tags: list[str]
    due_date: str | None
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class LearningItem:
    id: str
    user_id: str
    title: str
    area: str
    status: LearningStatus
    progress: int
    notes: str
    tags: list[str]
    updated_at: datetime


@dataclass(frozen=True)
class Note:
    id: str
    user_id: str
    title: str
    body: str
    category: str
    tags: list[str]
    updated_at: datetime


@dataclass(frozen=True)
class GoalTask:
    id: str
    goal_id: str
    title: str
    done: bool


@dataclass(frozen=True)
class Goal:
    id: str
    user_id: str
    title: str
    progress: int
    status: GoalStatus
    target_year: str | None
    tasks: list[GoalTask] = field(default_factory=list)
