import { createDefaultDashboardState } from "@/features/dashboard/data/dashboard-defaults";
import type {
  DashboardState,
  DashboardTab,
  GoalItem,
  GoalStatus,
  GoalTask,
  LearningItem,
  LearningStatus,
  NoteItem,
  TodoItem,
  TodoPriority,
} from "@/features/dashboard/types";
import type { ThemePreference } from "@/lib/theme/theme-provider";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

function clampProgress(value: unknown, fallback: number) {
  return Math.min(100, Math.max(0, asNumber(value, fallback)));
}

function asTheme(value: unknown): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "dark";
}

function asTab(value: unknown): DashboardTab {
  return value === "today" ||
    value === "todo" ||
    value === "learning" ||
    value === "notes" ||
    value === "goals" ||
    value === "settings"
    ? value
    : "today";
}

function asTodoPriority(value: unknown): TodoPriority {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function asLearningStatus(value: unknown): LearningStatus {
  return value === "queued" || value === "active" || value === "review" || value === "done" ? value : "queued";
}

function asGoalStatus(value: unknown): GoalStatus {
  return value === "planned" || value === "active" || value === "done" ? value : "planned";
}

export function normalizeTodos(value: unknown, fallback: TodoItem[]): TodoItem[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter(isRecord).map((item, index) => {
    const createdAt = asString(item.createdAt, new Date().toISOString());
    return {
      id: asString(item.id, `todo-${index}`),
      title: asString(item.title, "Untitled task"),
      done: asBoolean(item.done, false),
      priority: asTodoPriority(item.priority),
      tags: asStringArray(item.tags),
      dueDate: asOptionalString(item.dueDate),
      createdAt,
      updatedAt: asString(item.updatedAt, createdAt),
    };
  });
}

export function normalizeLearning(value: unknown, fallback: LearningItem[]): LearningItem[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter(isRecord).map((item, index) => ({
    id: asString(item.id, `learning-${index}`),
    title: asString(item.title, "Untitled learning item"),
    area: asString(item.area, "General"),
    status: asLearningStatus(item.status),
    progress: clampProgress(item.progress, 0),
    notes: asString(item.notes, ""),
    tags: asStringArray(item.tags),
    updatedAt: asString(item.updatedAt, new Date().toISOString()),
  }));
}

export function normalizeNotes(value: unknown, fallback: NoteItem[]): NoteItem[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter(isRecord).map((item, index) => ({
    id: asString(item.id, `note-${index}`),
    title: asString(item.title, "Untitled note"),
    body: asString(item.body, ""),
    category: asString(item.category, "General"),
    tags: asStringArray(item.tags),
    updatedAt: asString(item.updatedAt, new Date().toISOString()),
  }));
}

function normalizeGoalTasks(value: unknown, fallback: GoalTask[]): GoalTask[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter(isRecord).map((item, index) => ({
    id: asString(item.id, `goal-task-${index}`),
    title: asString(item.title, "Untitled milestone"),
    done: asBoolean(item.done, false),
  }));
}

export function normalizeGoals(value: unknown, fallback: GoalItem[]): GoalItem[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter(isRecord).map((item, index) => {
    const fallbackGoal = fallback[index];
    return {
      id: asString(item.id, `goal-${index}`),
      title: asString(item.title, "Untitled goal"),
      progress: clampProgress(item.progress, 0),
      status: asGoalStatus(item.status),
      targetYear: asOptionalString(item.targetYear),
      tasks: normalizeGoalTasks(item.tasks, fallbackGoal?.tasks ?? []),
    };
  });
}

export function hasDashboardStateShape(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  return ["version", "access", "preferences", "todos", "learningItems", "notes", "goals"].some((key) => key in value);
}

export function normalizeDashboardState(value: unknown): DashboardState {
  const fallback = createDefaultDashboardState();
  if (!isRecord(value)) return fallback;

  const access = isRecord(value.access) ? value.access : {};
  const preferences = isRecord(value.preferences) ? value.preferences : {};

  return {
    version: 2,
    access: {
      passcodeHash: typeof access.passcodeHash === "string" ? access.passcodeHash : undefined,
      unlocked: false,
    },
    preferences: {
      theme: asTheme(preferences.theme),
      activeTab: asTab(preferences.activeTab),
    },
    todos: normalizeTodos(value.todos, fallback.todos),
    learningItems: normalizeLearning(value.learningItems, fallback.learningItems),
    notes: normalizeNotes(value.notes, fallback.notes),
    goals: normalizeGoals(value.goals, fallback.goals),
  };
}

export function sanitizeDashboardStateForPersistence(state: DashboardState): DashboardState {
  const latest = normalizeDashboardState(state);
  return {
    ...latest,
    access: {
      ...latest.access,
      unlocked: false,
    },
  };
}