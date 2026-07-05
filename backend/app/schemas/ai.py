from datetime import datetime
from typing import Literal

from pydantic import Field

from app.domain.ai.entities import (
    AIProviderConfig,
    LearningPlanDraft,
    PlannerCommitResult,
    PlanGoal,
    PlanLearningItem,
    PlanNotePrompt,
    PlanTodo,
)
from app.schemas.common import APIModel

AIProviderType = Literal["openai_compatible"]


class AIProviderCreate(APIModel):
    provider_type: AIProviderType = Field(default="openai_compatible", alias="providerType")
    display_name: str = Field(alias="displayName")
    base_url: str = Field(alias="baseUrl")
    api_key: str = Field(alias="apiKey")
    model: str
    enabled: bool = True
    is_default: bool = Field(default=False, alias="isDefault")


class AIProviderUpdate(APIModel):
    provider_type: AIProviderType | None = Field(default=None, alias="providerType")
    display_name: str | None = Field(default=None, alias="displayName")
    base_url: str | None = Field(default=None, alias="baseUrl")
    api_key: str | None = Field(default=None, alias="apiKey")
    model: str | None = None
    enabled: bool | None = None
    is_default: bool | None = Field(default=None, alias="isDefault")


class AIProviderRead(APIModel):
    id: str
    provider_type: AIProviderType = Field(alias="providerType")
    display_name: str = Field(alias="displayName")
    base_url: str = Field(alias="baseUrl")
    model: str
    enabled: bool
    is_default: bool = Field(alias="isDefault")
    has_api_key: bool = Field(alias="hasApiKey")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    @classmethod
    def from_entity(cls, config: AIProviderConfig) -> "AIProviderRead":
        return cls(
            id=config.id,
            provider_type=config.provider_type,
            display_name=config.display_name,
            base_url=config.base_url,
            model=config.model,
            enabled=config.enabled,
            is_default=config.is_default,
            has_api_key=bool(config.api_key),
            created_at=config.created_at,
            updated_at=config.updated_at,
        )


class LearningGoalInputCreate(APIModel):
    target: str
    current_level: str = Field(alias="currentLevel")
    deadline: str | None = None
    weekly_hours: int = Field(default=5, alias="weeklyHours")
    preferred_stack: list[str] = Field(default_factory=list, alias="preferredStack")
    constraints: str = ""


class PlanGoalRead(APIModel):
    title: str
    target_year: str | None = Field(alias="targetYear")

    @classmethod
    def from_entity(cls, goal: PlanGoal) -> "PlanGoalRead":
        return cls(title=goal.title, target_year=goal.target_year)


class PlanLearningItemRead(APIModel):
    title: str
    area: str
    status: str
    progress: int
    notes: str
    tags: list[str]

    @classmethod
    def from_entity(cls, item: PlanLearningItem) -> "PlanLearningItemRead":
        return cls(
            title=item.title,
            area=item.area,
            status=item.status,
            progress=item.progress,
            notes=item.notes,
            tags=item.tags,
        )


class PlanTodoRead(APIModel):
    title: str
    priority: str
    due_date: str | None = Field(alias="dueDate")
    tags: list[str]

    @classmethod
    def from_entity(cls, todo: PlanTodo) -> "PlanTodoRead":
        return cls(title=todo.title, priority=todo.priority, due_date=todo.due_date, tags=todo.tags)


class PlanNotePromptRead(APIModel):
    title: str
    category: str
    prompt: str
    tags: list[str]

    @classmethod
    def from_entity(cls, prompt: PlanNotePrompt) -> "PlanNotePromptRead":
        return cls(title=prompt.title, category=prompt.category, prompt=prompt.prompt, tags=prompt.tags)


class LearningPlanDraftRead(APIModel):
    id: str
    title: str
    summary: str
    goals: list[PlanGoalRead]
    learning_items: list[PlanLearningItemRead] = Field(alias="learningItems")
    todos: list[PlanTodoRead]
    note_prompts: list[PlanNotePromptRead] = Field(alias="notePrompts")
    status: str
    created_at: datetime = Field(alias="createdAt")

    @classmethod
    def from_entity(cls, draft: LearningPlanDraft) -> "LearningPlanDraftRead":
        return cls(
            id=draft.id,
            title=draft.title,
            summary=draft.summary,
            goals=[PlanGoalRead.from_entity(goal) for goal in draft.goals],
            learning_items=[PlanLearningItemRead.from_entity(item) for item in draft.learning_items],
            todos=[PlanTodoRead.from_entity(todo) for todo in draft.todos],
            note_prompts=[PlanNotePromptRead.from_entity(prompt) for prompt in draft.note_prompts],
            status=draft.status,
            created_at=draft.created_at,
        )


class PlannerCommitResultRead(APIModel):
    draft_id: str = Field(alias="draftId")
    status: str
    goals_created: int = Field(alias="goalsCreated")
    learning_items_created: int = Field(alias="learningItemsCreated")
    todos_created: int = Field(alias="todosCreated")
    notes_created: int = Field(alias="notesCreated")

    @classmethod
    def from_entity(cls, result: PlannerCommitResult) -> "PlannerCommitResultRead":
        return cls(
            draft_id=result.draft_id,
            status=result.status,
            goals_created=result.goals_created,
            learning_items_created=result.learning_items_created,
            todos_created=result.todos_created,
            notes_created=result.notes_created,
        )
