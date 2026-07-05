from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal

AIProviderType = Literal["openai_compatible"]
PlanDraftStatus = Literal["draft", "committed"]


@dataclass(frozen=True)
class AIProviderConfig:
    id: str
    user_id: str
    provider_type: AIProviderType
    display_name: str
    base_url: str
    api_key: str
    model: str
    enabled: bool
    is_default: bool
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True)
class LLMJsonRequest:
    model: str
    system_prompt: str
    user_prompt: str


@dataclass(frozen=True)
class LearningGoalInput:
    target: str
    current_level: str
    deadline: str | None
    weekly_hours: int
    preferred_stack: list[str] = field(default_factory=list)
    constraints: str = ""


@dataclass(frozen=True)
class PlanGoal:
    title: str
    target_year: str | None = None


@dataclass(frozen=True)
class PlanLearningItem:
    title: str
    area: str
    status: str
    progress: int
    notes: str
    tags: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class PlanTodo:
    title: str
    priority: str
    due_date: str | None = None
    tags: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class PlanNotePrompt:
    title: str
    category: str
    prompt: str
    tags: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class LearningPlanDraft:
    id: str
    user_id: str
    title: str
    summary: str
    goals: list[PlanGoal]
    learning_items: list[PlanLearningItem]
    todos: list[PlanTodo]
    note_prompts: list[PlanNotePrompt]
    raw_plan: dict[str, object]
    status: PlanDraftStatus
    created_at: datetime


@dataclass(frozen=True)
class PlannerCommitResult:
    draft_id: str
    status: PlanDraftStatus
    goals_created: int
    learning_items_created: int
    todos_created: int
    notes_created: int


@dataclass(frozen=True)
class AIProviderTestResult:
    provider_id: str
    ok: bool
    message: str
