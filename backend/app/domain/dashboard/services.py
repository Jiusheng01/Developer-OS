from collections.abc import Mapping, Sequence
from datetime import UTC, datetime
from uuid import uuid4

from app.core.errors import ResourceNotFoundError, ValidationError
from app.domain.dashboard.entities import (
    Goal,
    GoalTask,
    LearningItem,
    Note,
    Todo,
    as_goal_status,
    as_learning_status,
    as_todo_priority,
)
from app.domain.dashboard.repositories import (
    GoalRepository,
    LearningRepository,
    NoteRepository,
    TodoRepository,
)


def _now() -> datetime:
    return datetime.now(UTC)


def _make_id(prefix: str) -> str:
    return f"{prefix}-{uuid4()}"


def _clean_required(value: object, field_name: str) -> str:
    if not isinstance(value, str):
        raise ValidationError(f"{field_name} must be a string")
    trimmed = value.strip()
    if not trimmed:
        raise ValidationError(f"{field_name} is required")
    return trimmed


def _clean_optional(value: object) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValidationError("optional text fields must be strings or null")
    trimmed = value.strip()
    return trimmed or None


def _clean_defaulted(value: object, fallback: str) -> str:
    if not isinstance(value, str):
        raise ValidationError("text field must be a string")
    return value.strip() or fallback


def _clean_tags(value: object) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValidationError("tags must be an array")
    seen: set[str] = set()
    tags: list[str] = []
    for item in value:
        if not isinstance(item, str):
            continue
        tag = item.strip()
        if tag and tag not in seen:
            tags.append(tag)
            seen.add(tag)
    return tags


def _clean_progress(value: object) -> int:
    if not isinstance(value, int):
        raise ValidationError("progress must be an integer")
    return min(100, max(0, value))


class DashboardService:
    def __init__(
        self,
        todos: TodoRepository,
        learning: LearningRepository,
        notes: NoteRepository,
        goals: GoalRepository,
    ) -> None:
        self._todos = todos
        self._learning = learning
        self._notes = notes
        self._goals = goals

    def list_todos(self, user_id: str) -> Sequence[Todo]:
        return self._todos.list_todos(user_id)

    def create_todo(self, user_id: str, data: Mapping[str, object]) -> Todo:
        now = _now()
        todo = Todo(
            id=_make_id("todo"),
            user_id=user_id,
            title=_clean_required(data.get("title"), "title"),
            done=False,
            priority=as_todo_priority(data.get("priority")),
            tags=_clean_tags(data.get("tags")),
            due_date=_clean_optional(data.get("due_date")),
            created_at=now,
            updated_at=now,
        )
        return self._todos.create_todo(user_id, todo)

    def update_todo(self, user_id: str, todo_id: str, data: Mapping[str, object]) -> Todo:
        changes: dict[str, object] = {"updated_at": _now()}
        if "title" in data:
            changes["title"] = _clean_required(data["title"], "title")
        if "done" in data:
            changes["done"] = data["done"]
        if "priority" in data:
            changes["priority"] = as_todo_priority(data["priority"])
        if "tags" in data:
            changes["tags"] = _clean_tags(data["tags"])
        if "due_date" in data:
            changes["due_date"] = _clean_optional(data["due_date"])
        todo = self._todos.update_todo(user_id, todo_id, changes)
        if todo is None:
            raise ResourceNotFoundError("todo", todo_id)
        return todo

    def delete_todo(self, user_id: str, todo_id: str) -> None:
        if not self._todos.delete_todo(user_id, todo_id):
            raise ResourceNotFoundError("todo", todo_id)

    def list_learning_items(self, user_id: str) -> Sequence[LearningItem]:
        return self._learning.list_learning_items(user_id)

    def create_learning_item(self, user_id: str, data: Mapping[str, object]) -> LearningItem:
        item = LearningItem(
            id=_make_id("learning"),
            user_id=user_id,
            title=_clean_required(data.get("title"), "title"),
            area=_clean_defaulted(data.get("area", "General"), "General"),
            status=as_learning_status(data.get("status")),
            progress=_clean_progress(data.get("progress", 0)),
            notes=str(data.get("notes") or ""),
            tags=_clean_tags(data.get("tags")),
            updated_at=_now(),
        )
        return self._learning.create_learning_item(user_id, item)

    def update_learning_item(self, user_id: str, item_id: str, data: Mapping[str, object]) -> LearningItem:
        changes: dict[str, object] = {"updated_at": _now()}
        if "title" in data:
            changes["title"] = _clean_required(data["title"], "title")
        if "area" in data:
            changes["area"] = _clean_defaulted(data["area"], "General")
        if "status" in data:
            changes["status"] = as_learning_status(data["status"])
        if "progress" in data:
            changes["progress"] = _clean_progress(data["progress"])
        if "notes" in data:
            changes["notes"] = str(data["notes"] or "")
        if "tags" in data:
            changes["tags"] = _clean_tags(data["tags"])
        item = self._learning.update_learning_item(user_id, item_id, changes)
        if item is None:
            raise ResourceNotFoundError("learning item", item_id)
        return item

    def delete_learning_item(self, user_id: str, item_id: str) -> None:
        if not self._learning.delete_learning_item(user_id, item_id):
            raise ResourceNotFoundError("learning item", item_id)

    def list_notes(self, user_id: str) -> Sequence[Note]:
        return self._notes.list_notes(user_id)

    def create_note(self, user_id: str, data: Mapping[str, object]) -> Note:
        note = Note(
            id=_make_id("note"),
            user_id=user_id,
            title=_clean_required(data.get("title"), "title"),
            body=str(data.get("body") or ""),
            category=_clean_defaulted(data.get("category", "General"), "General"),
            tags=_clean_tags(data.get("tags")),
            updated_at=_now(),
        )
        return self._notes.create_note(user_id, note)

    def update_note(self, user_id: str, note_id: str, data: Mapping[str, object]) -> Note:
        changes: dict[str, object] = {"updated_at": _now()}
        if "title" in data:
            changes["title"] = _clean_required(data["title"], "title")
        if "body" in data:
            changes["body"] = str(data["body"] or "")
        if "category" in data:
            changes["category"] = _clean_defaulted(data["category"], "General")
        if "tags" in data:
            changes["tags"] = _clean_tags(data["tags"])
        note = self._notes.update_note(user_id, note_id, changes)
        if note is None:
            raise ResourceNotFoundError("note", note_id)
        return note

    def delete_note(self, user_id: str, note_id: str) -> None:
        if not self._notes.delete_note(user_id, note_id):
            raise ResourceNotFoundError("note", note_id)

    def list_goals(self, user_id: str) -> Sequence[Goal]:
        return self._goals.list_goals(user_id)

    def create_goal(self, user_id: str, data: Mapping[str, object]) -> Goal:
        goal = Goal(
            id=_make_id("goal"),
            user_id=user_id,
            title=_clean_required(data.get("title"), "title"),
            progress=_clean_progress(data.get("progress", 0)),
            status=as_goal_status(data.get("status")),
            target_year=_clean_optional(data.get("target_year")),
            tasks=[],
        )
        return self._goals.create_goal(user_id, goal)

    def update_goal(self, user_id: str, goal_id: str, data: Mapping[str, object]) -> Goal:
        changes: dict[str, object] = {}
        if "title" in data:
            changes["title"] = _clean_required(data["title"], "title")
        if "progress" in data:
            changes["progress"] = _clean_progress(data["progress"])
        if "status" in data:
            changes["status"] = as_goal_status(data["status"])
        if "target_year" in data:
            changes["target_year"] = _clean_optional(data["target_year"])
        goal = self._goals.update_goal(user_id, goal_id, changes)
        if goal is None:
            raise ResourceNotFoundError("goal", goal_id)
        return goal

    def delete_goal(self, user_id: str, goal_id: str) -> None:
        if not self._goals.delete_goal(user_id, goal_id):
            raise ResourceNotFoundError("goal", goal_id)

    def create_goal_task(self, user_id: str, goal_id: str, data: Mapping[str, object]) -> GoalTask:
        task = GoalTask(
            id=_make_id("goal-task"),
            goal_id=goal_id,
            title=_clean_required(data.get("title"), "title"),
            done=False,
        )
        created = self._goals.create_goal_task(user_id, task)
        if created is None:
            raise ResourceNotFoundError("goal", goal_id)
        return created

    def update_goal_task(self, user_id: str, goal_id: str, task_id: str, data: Mapping[str, object]) -> GoalTask:
        changes: dict[str, object] = {}
        if "title" in data:
            changes["title"] = _clean_required(data["title"], "title")
        if "done" in data:
            changes["done"] = data["done"]
        task = self._goals.update_goal_task(user_id, goal_id, task_id, changes)
        if task is None:
            raise ResourceNotFoundError("goal task", task_id)
        return task

    def delete_goal_task(self, user_id: str, goal_id: str, task_id: str) -> None:
        if not self._goals.delete_goal_task(user_id, goal_id, task_id):
            raise ResourceNotFoundError("goal task", task_id)
