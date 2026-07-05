import {
  normalizeGoals,
  normalizeLearning,
  normalizeNotes,
  normalizeTodos,
} from "@/features/dashboard/data/dashboard-normalizers";
import {
  type DashboardDataProvider,
  type DashboardDataSnapshot,
} from "@/features/dashboard/data/dashboard-data-provider";
import { apiRequest } from "@/lib/api/http-client";
import type {
  GoalInput,
  GoalItem,
  GoalPatch,
  GoalTask,
  LearningInput,
  LearningItem,
  LearningPatch,
  NoteInput,
  NoteItem,
  NotePatch,
  TodoInput,
  TodoItem,
  TodoPatch,
} from "@/features/dashboard/types";

function encodeBody(value: unknown) {
  return JSON.stringify(value);
}

function hasPatchKey(patch: object, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(patch, key);
}

function serializeTodoPatch(patch: TodoPatch): Record<string, unknown> {
  return {
    ...patch,
    ...(hasPatchKey(patch, "dueDate") && patch.dueDate === undefined ? { dueDate: null } : {}),
  };
}

function serializeGoalPatch(patch: GoalPatch): Record<string, unknown> {
  return {
    ...patch,
    ...(hasPatchKey(patch, "targetYear") && patch.targetYear === undefined ? { targetYear: null } : {}),
  };
}

function normalizeTodo(value: unknown): TodoItem {
  const [todo] = normalizeTodos([value], []);
  if (!todo) throw new Error("Invalid todo response");
  return todo;
}

function normalizeLearningItem(value: unknown): LearningItem {
  const [item] = normalizeLearning([value], []);
  if (!item) throw new Error("Invalid learning item response");
  return item;
}

function normalizeNote(value: unknown): NoteItem {
  const [note] = normalizeNotes([value], []);
  if (!note) throw new Error("Invalid note response");
  return note;
}

function normalizeGoal(value: unknown): GoalItem {
  const [goal] = normalizeGoals([value], []);
  if (!goal) throw new Error("Invalid goal response");
  return goal;
}

function normalizeGoalTask(value: unknown): GoalTask {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Invalid goal task response");
  }
  const record = value as Record<string, unknown>;
  return {
    id: typeof record.id === "string" ? record.id : "goal-task-response",
    title: typeof record.title === "string" ? record.title : "Untitled milestone",
    done: typeof record.done === "boolean" ? record.done : false,
  };
}

async function listTodos() {
  return normalizeTodos(await apiRequest<unknown>("/todos"), []);
}

async function listLearningItems() {
  return normalizeLearning(await apiRequest<unknown>("/learning-items"), []);
}

async function listNotes() {
  return normalizeNotes(await apiRequest<unknown>("/notes"), []);
}

async function listGoals() {
  return normalizeGoals(await apiRequest<unknown>("/goals"), []);
}

async function resetRemoteData() {
  const snapshot = await apiDashboardProvider.loadData();
  await Promise.all(snapshot.todos.map((todo) => apiDashboardProvider.todos.delete(todo.id)));
  await Promise.all(snapshot.learningItems.map((item) => apiDashboardProvider.learning.delete(item.id)));
  await Promise.all(snapshot.notes.map((note) => apiDashboardProvider.notes.delete(note.id)));
  await Promise.all(snapshot.goals.map((goal) => apiDashboardProvider.goals.delete(goal.id)));
  return { todos: [], learningItems: [], notes: [], goals: [] } satisfies DashboardDataSnapshot;
}

export const apiDashboardProvider: DashboardDataProvider = {
  async loadData(): Promise<DashboardDataSnapshot> {
    const [todos, learningItems, notes, goals] = await Promise.all([
      listTodos(),
      listLearningItems(),
      listNotes(),
      listGoals(),
    ]);
    return { todos, learningItems, notes, goals };
  },

  async resetData() {
    return resetRemoteData();
  },

  todos: {
    async create(input: TodoInput) {
      return normalizeTodo(await apiRequest<unknown>("/todos", { method: "POST", body: encodeBody(input) }));
    },

    async update(id: string, patch: TodoPatch) {
      return normalizeTodo(await apiRequest<unknown>(`/todos/${id}`, { method: "PATCH", body: encodeBody(serializeTodoPatch(patch)) }));
    },

    async delete(id: string) {
      await apiRequest<void>(`/todos/${id}`, { method: "DELETE" });
    },
  },

  learning: {
    async create(input: LearningInput) {
      return normalizeLearningItem(
        await apiRequest<unknown>("/learning-items", { method: "POST", body: encodeBody(input) }),
      );
    },

    async update(id: string, patch: LearningPatch) {
      return normalizeLearningItem(
        await apiRequest<unknown>(`/learning-items/${id}`, { method: "PATCH", body: encodeBody(patch) }),
      );
    },

    async delete(id: string) {
      await apiRequest<void>(`/learning-items/${id}`, { method: "DELETE" });
    },
  },

  notes: {
    async create(input: NoteInput) {
      return normalizeNote(await apiRequest<unknown>("/notes", { method: "POST", body: encodeBody(input) }));
    },

    async update(id: string, patch: NotePatch) {
      return normalizeNote(await apiRequest<unknown>(`/notes/${id}`, { method: "PATCH", body: encodeBody(patch) }));
    },

    async delete(id: string) {
      await apiRequest<void>(`/notes/${id}`, { method: "DELETE" });
    },
  },

  goals: {
    async create(input: GoalInput) {
      return normalizeGoal(await apiRequest<unknown>("/goals", { method: "POST", body: encodeBody(input) }));
    },

    async update(id: string, patch: GoalPatch) {
      return normalizeGoal(await apiRequest<unknown>(`/goals/${id}`, { method: "PATCH", body: encodeBody(serializeGoalPatch(patch)) }));
    },

    async delete(id: string) {
      await apiRequest<void>(`/goals/${id}`, { method: "DELETE" });
    },

    async createTask(goalId: string, title: string) {
      return normalizeGoalTask(
        await apiRequest<unknown>(`/goals/${goalId}/tasks`, {
          method: "POST",
          body: encodeBody({ title }),
        }),
      );
    },

    async updateTask(goalId, taskId, patch) {
      return normalizeGoalTask(
        await apiRequest<unknown>(`/goals/${goalId}/tasks/${taskId}`, {
          method: "PATCH",
          body: encodeBody(patch),
        }),
      );
    },

    async deleteTask(goalId, taskId) {
      await apiRequest<void>(`/goals/${goalId}/tasks/${taskId}`, { method: "DELETE" });
    },
  },
};
