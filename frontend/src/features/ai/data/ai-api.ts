import { apiRequest } from "@/lib/api/http-client";
import type {
  AIProviderConfig,
  AIProviderInput,
  AIProviderPatch,
  AIProviderTestResult,
  LearningGoalInput,
  LearningPlanDraft,
  PlannerCommitResult,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalizeProvider(value: unknown): AIProviderConfig {
  if (!isRecord(value)) throw new Error("Invalid AI provider payload");
  return {
    id: stringValue(value.id),
    providerType: value.providerType === "openai_compatible" ? "openai_compatible" : "openai_compatible",
    displayName: stringValue(value.displayName),
    baseUrl: stringValue(value.baseUrl),
    model: stringValue(value.model),
    enabled: value.enabled === true,
    isDefault: value.isDefault === true,
    hasApiKey: value.hasApiKey === true,
    createdAt: stringValue(value.createdAt),
    updatedAt: stringValue(value.updatedAt),
  };
}

function normalizePlanDraft(value: unknown): LearningPlanDraft {
  if (!isRecord(value)) throw new Error("Invalid learning plan payload");
  return {
    id: stringValue(value.id),
    title: stringValue(value.title),
    summary: stringValue(value.summary),
    goals: Array.isArray(value.goals)
      ? value.goals.filter(isRecord).map((goal) => ({
          title: stringValue(goal.title),
          targetYear: stringValue(goal.targetYear) || undefined,
        }))
      : [],
    learningItems: Array.isArray(value.learningItems)
      ? value.learningItems.filter(isRecord).map((item) => ({
          title: stringValue(item.title),
          area: stringValue(item.area),
          status: stringValue(item.status, "queued"),
          progress: typeof item.progress === "number" ? item.progress : 0,
          notes: stringValue(item.notes),
          tags: stringArray(item.tags),
        }))
      : [],
    todos: Array.isArray(value.todos)
      ? value.todos.filter(isRecord).map((todo) => ({
          title: stringValue(todo.title),
          priority: stringValue(todo.priority, "medium"),
          dueDate: stringValue(todo.dueDate) || undefined,
          tags: stringArray(todo.tags),
        }))
      : [],
    notePrompts: Array.isArray(value.notePrompts)
      ? value.notePrompts.filter(isRecord).map((prompt) => ({
          title: stringValue(prompt.title),
          category: stringValue(prompt.category, "Learning"),
          prompt: stringValue(prompt.prompt),
          tags: stringArray(prompt.tags),
        }))
      : [],
    status: stringValue(value.status, "draft"),
    createdAt: stringValue(value.createdAt),
  };
}

function normalizeCommitResult(value: unknown): PlannerCommitResult {
  if (!isRecord(value)) throw new Error("Invalid planner commit payload");
  return {
    draftId: stringValue(value.draftId),
    status: stringValue(value.status),
    goalsCreated: typeof value.goalsCreated === "number" ? value.goalsCreated : 0,
    learningItemsCreated: typeof value.learningItemsCreated === "number" ? value.learningItemsCreated : 0,
    todosCreated: typeof value.todosCreated === "number" ? value.todosCreated : 0,
    notesCreated: typeof value.notesCreated === "number" ? value.notesCreated : 0,
  };
}

function normalizeProviderTestResult(value: unknown): AIProviderTestResult {
  if (!isRecord(value)) throw new Error("Invalid AI provider test payload");
  return {
    providerId: stringValue(value.providerId),
    ok: value.ok === true,
    message: stringValue(value.message),
  };
}

function encodeBody(value: unknown) {
  return JSON.stringify(value);
}

export async function listAIProviders() {
  const payload = await apiRequest<unknown>("/ai/providers");
  if (!Array.isArray(payload)) throw new Error("Invalid AI providers payload");
  return payload.map(normalizeProvider);
}

export async function createAIProvider(input: AIProviderInput) {
  return normalizeProvider(await apiRequest<unknown>("/ai/providers", { method: "POST", body: encodeBody(input) }));
}

export async function updateAIProvider(id: string, patch: AIProviderPatch) {
  return normalizeProvider(await apiRequest<unknown>(`/ai/providers/${id}`, { method: "PATCH", body: encodeBody(patch) }));
}

export async function deleteAIProvider(id: string) {
  await apiRequest<void>(`/ai/providers/${id}`, { method: "DELETE" });
}

export async function setDefaultAIProvider(id: string) {
  return normalizeProvider(await apiRequest<unknown>(`/ai/providers/${id}/default`, { method: "POST" }));
}

export async function testAIProvider(id: string) {
  return normalizeProviderTestResult(await apiRequest<unknown>(`/ai/providers/${id}/test`, { method: "POST" }));
}

export async function generateLearningPlan(input: LearningGoalInput) {
  return normalizePlanDraft(
    await apiRequest<unknown>("/ai/planner/generate", { method: "POST", body: encodeBody(input) }),
  );
}

export async function listLearningPlanDrafts() {
  const payload = await apiRequest<unknown>("/ai/planner/drafts");
  if (!Array.isArray(payload)) throw new Error("Invalid learning plan draft history payload");
  return payload.map(normalizePlanDraft);
}

export async function commitLearningPlanDraft(draftId: string) {
  return normalizeCommitResult(
    await apiRequest<unknown>(`/ai/planner/drafts/${draftId}/commit`, { method: "POST" }),
  );
}
