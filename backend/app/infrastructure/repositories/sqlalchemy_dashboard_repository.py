import json
from collections.abc import Mapping, Sequence
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

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
from app.infrastructure.database.models import (
    GoalModel,
    GoalTaskModel,
    LearningItemModel,
    NoteModel,
    TodoModel,
)

def _encode_tags(tags: object) -> str:
    if not isinstance(tags, list):
        return "[]"
    safe_tags = [tag for tag in tags if isinstance(tag, str)]
    return json.dumps(safe_tags)


def _decode_tags(raw: str | None) -> list[str]:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return []
    if not isinstance(parsed, list):
        return []
    return [tag for tag in parsed if isinstance(tag, str)]


def _apply_changes(model: object, changes: Mapping[str, object]) -> None:
    for key, value in changes.items():
        if key == "tags":
            setattr(model, key, _encode_tags(value))
        else:
            setattr(model, key, value)


class SQLAlchemyDashboardRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def list_todos(self) -> Sequence[Todo]:
        models = self._session.scalars(
            select(TodoModel).order_by(TodoModel.updated_at.desc(), TodoModel.created_at.desc())
        ).all()
        return [self._todo_from_model(model) for model in models]

    def create_todo(self, todo: Todo) -> Todo:
        model = TodoModel(
            id=todo.id,
            title=todo.title,
            done=todo.done,
            priority=todo.priority,
            tags=_encode_tags(todo.tags),
            due_date=todo.due_date,
            created_at=todo.created_at,
            updated_at=todo.updated_at,
        )
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._todo_from_model(model)

    def update_todo(self, todo_id: str, changes: Mapping[str, object]) -> Todo | None:
        model = self._session.get(TodoModel, todo_id)
        if model is None:
            return None
        _apply_changes(model, changes)
        self._session.commit()
        self._session.refresh(model)
        return self._todo_from_model(model)

    def delete_todo(self, todo_id: str) -> bool:
        model = self._session.get(TodoModel, todo_id)
        if model is None:
            return False
        self._session.delete(model)
        self._session.commit()
        return True

    def list_learning_items(self) -> Sequence[LearningItem]:
        models = self._session.scalars(
            select(LearningItemModel).order_by(LearningItemModel.updated_at.desc())
        ).all()
        return [self._learning_from_model(model) for model in models]

    def create_learning_item(self, item: LearningItem) -> LearningItem:
        model = LearningItemModel(
            id=item.id,
            title=item.title,
            area=item.area,
            status=item.status,
            progress=item.progress,
            notes=item.notes,
            tags=_encode_tags(item.tags),
            updated_at=item.updated_at,
        )
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._learning_from_model(model)

    def update_learning_item(self, item_id: str, changes: Mapping[str, object]) -> LearningItem | None:
        model = self._session.get(LearningItemModel, item_id)
        if model is None:
            return None
        _apply_changes(model, changes)
        self._session.commit()
        self._session.refresh(model)
        return self._learning_from_model(model)

    def delete_learning_item(self, item_id: str) -> bool:
        model = self._session.get(LearningItemModel, item_id)
        if model is None:
            return False
        self._session.delete(model)
        self._session.commit()
        return True

    def list_notes(self) -> Sequence[Note]:
        models = self._session.scalars(select(NoteModel).order_by(NoteModel.updated_at.desc())).all()
        return [self._note_from_model(model) for model in models]

    def create_note(self, note: Note) -> Note:
        model = NoteModel(
            id=note.id,
            title=note.title,
            body=note.body,
            category=note.category,
            tags=_encode_tags(note.tags),
            updated_at=note.updated_at,
        )
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._note_from_model(model)

    def update_note(self, note_id: str, changes: Mapping[str, object]) -> Note | None:
        model = self._session.get(NoteModel, note_id)
        if model is None:
            return None
        _apply_changes(model, changes)
        self._session.commit()
        self._session.refresh(model)
        return self._note_from_model(model)

    def delete_note(self, note_id: str) -> bool:
        model = self._session.get(NoteModel, note_id)
        if model is None:
            return False
        self._session.delete(model)
        self._session.commit()
        return True

    def list_goals(self) -> Sequence[Goal]:
        models = self._session.scalars(
            select(GoalModel)
            .options(selectinload(GoalModel.tasks))
            .order_by(GoalModel.updated_at.desc(), GoalModel.id.desc())
        ).all()
        return [self._goal_from_model(model) for model in models]

    def create_goal(self, goal: Goal) -> Goal:
        model = GoalModel(
            id=goal.id,
            title=goal.title,
            progress=goal.progress,
            status=goal.status,
            target_year=goal.target_year,
        )
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._goal_from_model(model)

    def update_goal(self, goal_id: str, changes: Mapping[str, object]) -> Goal | None:
        model = self._session.get(GoalModel, goal_id)
        if model is None:
            return None
        _apply_changes(model, changes)
        self._session.commit()
        self._session.refresh(model)
        return self._goal_from_model(model)

    def delete_goal(self, goal_id: str) -> bool:
        model = self._session.get(GoalModel, goal_id)
        if model is None:
            return False
        self._session.delete(model)
        self._session.commit()
        return True

    def create_goal_task(self, task: GoalTask) -> GoalTask | None:
        goal = self._session.get(GoalModel, task.goal_id)
        if goal is None:
            return None
        model = GoalTaskModel(
            id=task.id,
            goal_id=task.goal_id,
            title=task.title,
            done=task.done,
        )
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._goal_task_from_model(model)

    def update_goal_task(
        self,
        goal_id: str,
        task_id: str,
        changes: Mapping[str, object],
    ) -> GoalTask | None:
        model = self._session.get(GoalTaskModel, task_id)
        if model is None or model.goal_id != goal_id:
            return None
        _apply_changes(model, changes)
        self._session.commit()
        self._session.refresh(model)
        return self._goal_task_from_model(model)

    def delete_goal_task(self, goal_id: str, task_id: str) -> bool:
        model = self._session.get(GoalTaskModel, task_id)
        if model is None or model.goal_id != goal_id:
            return False
        self._session.delete(model)
        self._session.commit()
        return True

    @staticmethod
    def _todo_from_model(model: TodoModel) -> Todo:
        return Todo(
            id=model.id,
            title=model.title,
            done=model.done,
            priority=as_todo_priority(model.priority),
            tags=_decode_tags(model.tags),
            due_date=model.due_date,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def _learning_from_model(model: LearningItemModel) -> LearningItem:
        return LearningItem(
            id=model.id,
            title=model.title,
            area=model.area,
            status=as_learning_status(model.status),
            progress=model.progress,
            notes=model.notes,
            tags=_decode_tags(model.tags),
            updated_at=model.updated_at,
        )

    @staticmethod
    def _note_from_model(model: NoteModel) -> Note:
        return Note(
            id=model.id,
            title=model.title,
            body=model.body,
            category=model.category,
            tags=_decode_tags(model.tags),
            updated_at=model.updated_at,
        )

    @staticmethod
    def _goal_from_model(model: GoalModel) -> Goal:
        return Goal(
            id=model.id,
            title=model.title,
            progress=model.progress,
            status=as_goal_status(model.status),
            target_year=model.target_year,
            tasks=[SQLAlchemyDashboardRepository._goal_task_from_model(task) for task in model.tasks],
        )

    @staticmethod
    def _goal_task_from_model(model: GoalTaskModel) -> GoalTask:
        return GoalTask(
            id=model.id,
            goal_id=model.goal_id,
            title=model.title,
            done=model.done,
        )