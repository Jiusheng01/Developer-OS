from collections.abc import Mapping, Sequence
from datetime import UTC, datetime
from urllib.parse import urlparse
from uuid import uuid4

from app.core.errors import ResourceNotFoundError, ValidationError
from app.domain.ai.entities import (
    AIProviderConfig,
    AIProviderTestResult,
    AIProviderType,
    LLMJsonRequest,
    LearningGoalInput,
    LearningPlanDraft,
    PlannerCommitResult,
    PlanGoal,
    PlanLearningItem,
    PlanNotePrompt,
    PlanTodo,
)
from app.domain.ai.providers import LLMProviderFactory
from app.domain.ai.repositories import AIRepository
from app.domain.ai.unit_of_work import UnitOfWork
from app.domain.dashboard.services import DashboardService

PROVIDER_TYPES: tuple[AIProviderType, ...] = ("openai_compatible",)
LEARNING_STATUSES = ("queued", "active", "review", "done")
TODO_PRIORITIES = ("low", "medium", "high")


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


def _clean_url(value: object) -> str:
    url = _clean_required(value, "base_url").rstrip("/")
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValidationError("base_url must be a valid http or https URL")
    return url


def _clean_provider_type(value: object) -> AIProviderType:
    if value in PROVIDER_TYPES:
        return value  # type: ignore[return-value]
    raise ValidationError("provider_type is not supported")


def _clean_bool(value: object, fallback: bool) -> bool:
    if value is None:
        return fallback
    if not isinstance(value, bool):
        raise ValidationError("boolean fields must be true or false")
    return value


def _clean_positive_hours(value: object) -> int:
    if not isinstance(value, int):
        raise ValidationError("weekly_hours must be an integer")
    if value <= 0 or value > 80:
        raise ValidationError("weekly_hours must be between 1 and 80")
    return value


def _clean_string_list(value: object) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValidationError("preferred_stack must be an array")
    seen: set[str] = set()
    cleaned: list[str] = []
    for item in value:
        if not isinstance(item, str):
            continue
        trimmed = item.strip()
        if trimmed and trimmed not in seen:
            cleaned.append(trimmed)
            seen.add(trimmed)
    return cleaned


def _as_record(value: object, field_name: str) -> dict[str, object]:
    if not isinstance(value, dict):
        raise ValidationError(f"{field_name} must be an object")
    return {str(key): item for key, item in value.items()}


def _as_record_list(value: object, field_name: str) -> list[dict[str, object]]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise ValidationError(f"{field_name} must be an array")
    records: list[dict[str, object]] = []
    for item in value:
        records.append(_as_record(item, field_name))
    return records


def _clean_plan_text(value: object, fallback: str) -> str:
    if isinstance(value, str):
        trimmed = value.strip()
        if trimmed:
            return trimmed
    return fallback


def _clean_plan_tags(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [tag.strip() for tag in value if isinstance(tag, str) and tag.strip()]


def _clean_progress(value: object) -> int:
    if not isinstance(value, int):
        return 0
    return min(100, max(0, value))


class AIProviderService:
    def __init__(self, repository: AIRepository, provider_factory: LLMProviderFactory | None = None) -> None:
        self._repository = repository
        self._provider_factory = provider_factory

    def list_provider_configs(self, user_id: str) -> Sequence[AIProviderConfig]:
        return self._repository.list_provider_configs(user_id)

    def create_provider_config(self, user_id: str, data: Mapping[str, object]) -> AIProviderConfig:
        is_default = _clean_bool(data.get("is_default"), False)
        if self._repository.get_default_provider_config(user_id) is None:
            is_default = True

        now = _now()
        config = AIProviderConfig(
            id=_make_id("ai-provider"),
            user_id=user_id,
            provider_type=_clean_provider_type(data.get("provider_type", "openai_compatible")),
            display_name=_clean_required(data.get("display_name"), "display_name"),
            base_url=_clean_url(data.get("base_url")),
            api_key=_clean_required(data.get("api_key"), "api_key"),
            model=_clean_required(data.get("model"), "model"),
            enabled=_clean_bool(data.get("enabled"), True),
            is_default=is_default,
            created_at=now,
            updated_at=now,
        )
        return self._repository.create_provider_config(config)

    def update_provider_config(
        self,
        user_id: str,
        provider_id: str,
        data: Mapping[str, object],
    ) -> AIProviderConfig:
        changes: dict[str, object] = {"updated_at": _now()}
        if "provider_type" in data:
            changes["provider_type"] = _clean_provider_type(data["provider_type"])
        if "display_name" in data:
            changes["display_name"] = _clean_required(data["display_name"], "display_name")
        if "base_url" in data:
            changes["base_url"] = _clean_url(data["base_url"])
        if "api_key" in data and data["api_key"] is not None:
            changes["api_key"] = _clean_required(data["api_key"], "api_key")
        if "model" in data:
            changes["model"] = _clean_required(data["model"], "model")
        if "enabled" in data:
            changes["enabled"] = _clean_bool(data["enabled"], True)

        updated = self._repository.update_provider_config(user_id, provider_id, changes)
        if updated is None:
            raise ResourceNotFoundError("ai provider", provider_id)
        if data.get("is_default") is True:
            return self.set_default_provider_config(user_id, provider_id)
        return updated

    def delete_provider_config(self, user_id: str, provider_id: str) -> None:
        if not self._repository.delete_provider_config(user_id, provider_id):
            raise ResourceNotFoundError("ai provider", provider_id)

    def set_default_provider_config(self, user_id: str, provider_id: str) -> AIProviderConfig:
        config = self._repository.set_default_provider_config(user_id, provider_id)
        if config is None:
            raise ResourceNotFoundError("ai provider", provider_id)
        return config

    def test_provider_config(self, user_id: str, provider_id: str) -> AIProviderTestResult:
        if self._provider_factory is None:
            raise ValidationError("AI provider test is not configured")
        config = self._repository.get_provider_config(user_id, provider_id)
        if config is None:
            raise ResourceNotFoundError("ai provider", provider_id)
        if not config.enabled:
            raise ValidationError("AI provider is disabled")
        provider = self._provider_factory.create(config)
        payload = provider.generate_json(
            LLMJsonRequest(
                model=config.model,
                system_prompt="Return only JSON.",
                user_prompt='Return {"status":"ok"} to confirm the provider is reachable.',
            )
        )
        if payload.get("status") != "ok":
            raise ValidationError("AI provider test returned an unexpected response")
        return AIProviderTestResult(provider_id=provider_id, ok=True, message="AI provider is reachable")


class AIPlannerService:
    def __init__(
        self,
        repository: AIRepository,
        provider_factory: LLMProviderFactory,
        dashboard_service: DashboardService | None = None,
        unit_of_work: UnitOfWork | None = None,
    ) -> None:
        self._repository = repository
        self._provider_factory = provider_factory
        self._dashboard_service = dashboard_service
        self._unit_of_work = unit_of_work

    def generate_plan(self, user_id: str, data: Mapping[str, object]) -> LearningPlanDraft:
        goal_input = LearningGoalInput(
            target=_clean_required(data.get("target"), "target"),
            current_level=_clean_required(data.get("current_level"), "current_level"),
            deadline=_clean_optional(data.get("deadline")),
            weekly_hours=_clean_positive_hours(data.get("weekly_hours", 5)),
            preferred_stack=_clean_string_list(data.get("preferred_stack")),
            constraints=str(data.get("constraints") or "").strip(),
        )
        config = self._repository.get_default_provider_config(user_id)
        if config is None or not config.enabled:
            raise ValidationError("AI provider setup required")

        provider = self._provider_factory.create(config)
        raw_plan = provider.generate_json(
            LLMJsonRequest(
                model=config.model,
                system_prompt=_planner_system_prompt(),
                user_prompt=_planner_user_prompt(goal_input),
            )
        )
        draft = _plan_draft_from_payload(user_id, raw_plan)
        created = self._repository.create_plan_draft(draft)
        if self._unit_of_work is not None:
            self._unit_of_work.commit()
        return created

    def list_plan_drafts(self, user_id: str, limit: int = 20) -> Sequence[LearningPlanDraft]:
        return self._repository.list_plan_drafts(user_id, limit)

    def commit_plan(self, user_id: str, draft_id: str) -> PlannerCommitResult:
        if self._dashboard_service is None:
            raise ValidationError("planner commit is not configured")
        draft = self._repository.get_plan_draft(user_id, draft_id)
        if draft is None:
            raise ResourceNotFoundError("ai plan draft", draft_id)
        if draft.status == "committed":
            raise ValidationError("AI plan draft is already committed")

        try:
            for goal in draft.goals:
                self._dashboard_service.create_goal(
                    user_id,
                    {
                        "title": goal.title,
                        "progress": 0,
                        "status": "active",
                        "target_year": goal.target_year,
                    },
                )
            for item in draft.learning_items:
                self._dashboard_service.create_learning_item(
                    user_id,
                    {
                        "title": item.title,
                        "area": item.area,
                        "status": item.status,
                        "progress": item.progress,
                        "notes": item.notes,
                        "tags": item.tags,
                    },
                )
            for todo in draft.todos:
                self._dashboard_service.create_todo(
                    user_id,
                    {
                        "title": todo.title,
                        "priority": todo.priority,
                        "tags": todo.tags,
                        "due_date": todo.due_date,
                    },
                )
            for prompt in draft.note_prompts:
                self._dashboard_service.create_note(
                    user_id,
                    {
                        "title": prompt.title,
                        "body": prompt.prompt,
                        "category": prompt.category,
                        "tags": prompt.tags,
                    },
                )
            updated = self._repository.update_plan_draft_status(user_id, draft_id, "committed")
            if updated is None:
                raise ResourceNotFoundError("ai plan draft", draft_id)
            if self._unit_of_work is not None:
                self._unit_of_work.commit()
        except Exception:
            if self._unit_of_work is not None:
                self._unit_of_work.rollback()
            raise

        return PlannerCommitResult(
            draft_id=draft.id,
            status="committed",
            goals_created=len(draft.goals),
            learning_items_created=len(draft.learning_items),
            todos_created=len(draft.todos),
            notes_created=len(draft.note_prompts),
        )


def _planner_system_prompt() -> str:
    return (
        "You are an AI learning planner. Return only valid JSON. "
        "Plan for execution, not chat. Do not include markdown fences."
    )


def _planner_user_prompt(goal: LearningGoalInput) -> str:
    stack = ", ".join(goal.preferred_stack) if goal.preferred_stack else "not specified"
    deadline = goal.deadline or "not specified"
    constraints = goal.constraints or "none"
    return (
        "Create an executable learning plan with this JSON shape: "
        "{title, summary, goals:[{title,targetYear}], "
        "learningItems:[{title,area,status,progress,notes,tags}], "
        "todos:[{title,priority,dueDate,tags}], "
        "notePrompts:[{title,category,prompt,tags}]}. "
        f"Target: {goal.target}. Current level: {goal.current_level}. "
        f"Deadline: {deadline}. Weekly hours: {goal.weekly_hours}. "
        f"Preferred stack: {stack}. Constraints: {constraints}."
    )


def _plan_draft_from_payload(user_id: str, payload: Mapping[str, object]) -> LearningPlanDraft:
    title = _clean_plan_text(payload.get("title"), "AI learning plan")
    summary = _clean_plan_text(payload.get("summary"), "")
    goals = [
        PlanGoal(
            title=_clean_plan_text(item.get("title"), "Learning goal"),
            target_year=_clean_optional(item.get("targetYear") or item.get("target_year")),
        )
        for item in _as_record_list(payload.get("goals"), "goals")
    ]
    learning_items = [
        PlanLearningItem(
            title=_clean_plan_text(item.get("title"), "Learning item"),
            area=_clean_plan_text(item.get("area"), "AI Learning"),
            status=str(item.get("status")) if item.get("status") in LEARNING_STATUSES else "queued",
            progress=_clean_progress(item.get("progress")),
            notes=_clean_plan_text(item.get("notes"), ""),
            tags=_clean_plan_tags(item.get("tags")),
        )
        for item in _as_record_list(payload.get("learningItems") or payload.get("learning_items"), "learningItems")
    ]
    todos = [
        PlanTodo(
            title=_clean_plan_text(item.get("title"), "Learning task"),
            priority=str(item.get("priority")) if item.get("priority") in TODO_PRIORITIES else "medium",
            due_date=_clean_optional(item.get("dueDate") or item.get("due_date")),
            tags=_clean_plan_tags(item.get("tags")),
        )
        for item in _as_record_list(payload.get("todos"), "todos")
    ]
    note_prompts = [
        PlanNotePrompt(
            title=_clean_plan_text(item.get("title"), "Learning reflection"),
            category=_clean_plan_text(item.get("category"), "Learning"),
            prompt=_clean_plan_text(item.get("prompt"), ""),
            tags=_clean_plan_tags(item.get("tags")),
        )
        for item in _as_record_list(payload.get("notePrompts") or payload.get("note_prompts"), "notePrompts")
    ]

    if not goals and not learning_items and not todos:
        raise ValidationError("AI plan must include goals, learning items, or todos")

    raw_plan: dict[str, object] = {
        "title": title,
        "summary": summary,
        "goals": [goal.__dict__ for goal in goals],
        "learningItems": [item.__dict__ for item in learning_items],
        "todos": [todo.__dict__ for todo in todos],
        "notePrompts": [prompt.__dict__ for prompt in note_prompts],
    }
    return LearningPlanDraft(
        id=_make_id("ai-plan"),
        user_id=user_id,
        title=title,
        summary=summary,
        goals=goals,
        learning_items=learning_items,
        todos=todos,
        note_prompts=note_prompts,
        raw_plan=raw_plan,
        status="draft",
        created_at=_now(),
    )
