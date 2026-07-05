import json
from collections.abc import Mapping, Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.ai.entities import (
    AIProviderConfig,
    AIProviderType,
    LearningPlanDraft,
    PlanDraftStatus,
    PlanGoal,
    PlanLearningItem,
    PlanNotePrompt,
    PlanTodo,
)
from app.infrastructure.database.models import AIPlanDraftModel, AIProviderModel


class SQLAlchemyAIRepository:
    def __init__(self, session: Session, auto_commit: bool = True) -> None:
        self._session = session
        self._auto_commit = auto_commit

    def _save(self, model: object) -> None:
        if self._auto_commit:
            self._session.commit()
        else:
            self._session.flush()
        self._session.refresh(model)

    def list_provider_configs(self, user_id: str) -> Sequence[AIProviderConfig]:
        models = self._session.scalars(
            select(AIProviderModel)
            .where(AIProviderModel.user_id == user_id)
            .order_by(AIProviderModel.is_default.desc(), AIProviderModel.updated_at.desc())
        ).all()
        return [self._provider_from_model(model) for model in models]

    def get_provider_config(self, user_id: str, provider_id: str) -> AIProviderConfig | None:
        model = self._session.scalar(
            select(AIProviderModel).where(AIProviderModel.user_id == user_id, AIProviderModel.id == provider_id)
        )
        return self._provider_from_model(model) if model is not None else None

    def get_default_provider_config(self, user_id: str) -> AIProviderConfig | None:
        model = self._session.scalar(
            select(AIProviderModel).where(
                AIProviderModel.user_id == user_id,
                AIProviderModel.enabled.is_(True),
                AIProviderModel.is_default.is_(True),
            )
        )
        return self._provider_from_model(model) if model is not None else None

    def create_provider_config(self, config: AIProviderConfig) -> AIProviderConfig:
        if config.is_default:
            self._clear_default(config.user_id)
        model = AIProviderModel(
            id=config.id,
            user_id=config.user_id,
            provider_type=config.provider_type,
            display_name=config.display_name,
            base_url=config.base_url,
            api_key=config.api_key,
            model=config.model,
            enabled=config.enabled,
            is_default=config.is_default,
            created_at=config.created_at,
            updated_at=config.updated_at,
        )
        self._session.add(model)
        self._save(model)
        return self._provider_from_model(model)

    def update_provider_config(
        self,
        user_id: str,
        provider_id: str,
        changes: Mapping[str, object],
    ) -> AIProviderConfig | None:
        model = self._session.scalar(
            select(AIProviderModel).where(AIProviderModel.user_id == user_id, AIProviderModel.id == provider_id)
        )
        if model is None:
            return None
        for key, value in changes.items():
            setattr(model, key, value)
        self._save(model)
        return self._provider_from_model(model)

    def delete_provider_config(self, user_id: str, provider_id: str) -> bool:
        model = self._session.scalar(
            select(AIProviderModel).where(AIProviderModel.user_id == user_id, AIProviderModel.id == provider_id)
        )
        if model is None:
            return False
        was_default = model.is_default
        self._session.delete(model)
        if self._auto_commit:
            self._session.commit()
        else:
            self._session.flush()
        if was_default:
            self._promote_first_provider(user_id)
        return True

    def set_default_provider_config(self, user_id: str, provider_id: str) -> AIProviderConfig | None:
        model = self._session.scalar(
            select(AIProviderModel).where(AIProviderModel.user_id == user_id, AIProviderModel.id == provider_id)
        )
        if model is None:
            return None
        self._clear_default(user_id)
        model.is_default = True
        model.enabled = True
        self._save(model)
        return self._provider_from_model(model)

    def create_plan_draft(self, draft: LearningPlanDraft) -> LearningPlanDraft:
        model = AIPlanDraftModel(
            id=draft.id,
            user_id=draft.user_id,
            title=draft.title,
            summary=draft.summary,
            raw_plan=json.dumps(draft.raw_plan),
            status=draft.status,
            created_at=draft.created_at,
        )
        self._session.add(model)
        self._save(model)
        return self._draft_from_model(model)

    def list_plan_drafts(self, user_id: str, limit: int = 20) -> Sequence[LearningPlanDraft]:
        safe_limit = min(100, max(1, limit))
        models = self._session.scalars(
            select(AIPlanDraftModel)
            .where(AIPlanDraftModel.user_id == user_id)
            .order_by(AIPlanDraftModel.created_at.desc())
            .limit(safe_limit)
        ).all()
        return [self._draft_from_model(model) for model in models]

    def get_plan_draft(self, user_id: str, draft_id: str) -> LearningPlanDraft | None:
        model = self._session.scalar(
            select(AIPlanDraftModel).where(AIPlanDraftModel.user_id == user_id, AIPlanDraftModel.id == draft_id)
        )
        return self._draft_from_model(model) if model is not None else None

    def update_plan_draft_status(
        self,
        user_id: str,
        draft_id: str,
        status: str,
    ) -> LearningPlanDraft | None:
        model = self._session.scalar(
            select(AIPlanDraftModel).where(AIPlanDraftModel.user_id == user_id, AIPlanDraftModel.id == draft_id)
        )
        if model is None:
            return None
        model.status = status
        self._save(model)
        return self._draft_from_model(model)

    def _clear_default(self, user_id: str) -> None:
        models = self._session.scalars(select(AIProviderModel).where(AIProviderModel.user_id == user_id)).all()
        for model in models:
            model.is_default = False

    def _promote_first_provider(self, user_id: str) -> None:
        model = self._session.scalar(
            select(AIProviderModel)
            .where(AIProviderModel.user_id == user_id, AIProviderModel.enabled.is_(True))
            .order_by(AIProviderModel.updated_at.desc())
        )
        if model is None:
            return
        model.is_default = True
        if self._auto_commit:
            self._session.commit()
        else:
            self._session.flush()

    @staticmethod
    def _provider_from_model(model: AIProviderModel) -> AIProviderConfig:
        provider_type: AIProviderType = (
            "openai_compatible" if model.provider_type == "openai_compatible" else "openai_compatible"
        )
        return AIProviderConfig(
            id=model.id,
            user_id=model.user_id,
            provider_type=provider_type,
            display_name=model.display_name,
            base_url=model.base_url,
            api_key=model.api_key,
            model=model.model,
            enabled=model.enabled,
            is_default=model.is_default,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def _draft_from_model(model: AIPlanDraftModel) -> LearningPlanDraft:
        try:
            raw_plan = json.loads(model.raw_plan)
        except json.JSONDecodeError:
            raw_plan = {}
        if not isinstance(raw_plan, dict):
            raw_plan = {}
        goals = [
            PlanGoal(title=str(item.get("title") or "Learning goal"), target_year=item.get("target_year"))
            for item in _records(raw_plan.get("goals"))
        ]
        learning_items = [
            PlanLearningItem(
                title=str(item.get("title") or "Learning item"),
                area=str(item.get("area") or "AI Learning"),
                status=str(item.get("status") or "queued"),
                progress=int(item.get("progress") or 0),
                notes=str(item.get("notes") or ""),
                tags=_string_list(item.get("tags")),
            )
            for item in _records(raw_plan.get("learningItems"))
        ]
        todos = [
            PlanTodo(
                title=str(item.get("title") or "Learning task"),
                priority=str(item.get("priority") or "medium"),
                due_date=item.get("due_date"),
                tags=_string_list(item.get("tags")),
            )
            for item in _records(raw_plan.get("todos"))
        ]
        note_prompts = [
            PlanNotePrompt(
                title=str(item.get("title") or "Learning reflection"),
                category=str(item.get("category") or "Learning"),
                prompt=str(item.get("prompt") or ""),
                tags=_string_list(item.get("tags")),
            )
            for item in _records(raw_plan.get("notePrompts"))
        ]
        status: PlanDraftStatus = "committed" if model.status == "committed" else "draft"
        return LearningPlanDraft(
            id=model.id,
            user_id=model.user_id,
            title=model.title,
            summary=model.summary,
            goals=goals,
            learning_items=learning_items,
            todos=todos,
            note_prompts=note_prompts,
            raw_plan=raw_plan,
            status=status,
            created_at=model.created_at,
        )


def _records(value: object) -> list[dict[str, object]]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict)]


def _string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str)]
