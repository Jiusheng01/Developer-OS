import {
  loadDashboardState,
  parseDashboardImport,
  resetDashboardState,
  saveDashboardState,
  serializeDashboardExport,
} from "@/features/dashboard/data/local-storage-dashboard-repository";
import {
  type DashboardDataProvider,
  type DashboardDataSnapshot,
  snapshotFromState,
} from "@/features/dashboard/data/dashboard-data-provider";
import type {
  DashboardState,
  GoalInput,
  GoalItem,
  GoalTask,
  LearningInput,
  NoteInput,
  TodoInput,
  TodoItem,
} from "@/features/dashboard/types";

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function updateLocalState(update: (current: DashboardState) => DashboardState): DashboardState {
  const next = update(loadDashboardState());
  saveDashboardState(next);
  return next;
}

function findOrThrow<T extends { id: string }>(items: T[], id: string, resource: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`${resource} not found: ${id}`);
  return item;
}

export const localStorageDashboardProvider: DashboardDataProvider = {
  async loadData(): Promise<DashboardDataSnapshot> {
    return snapshotFromState(loadDashboardState());
  },

  async resetData(): Promise<DashboardDataSnapshot> {
    return snapshotFromState(resetDashboardState());
  },

  async exportData(state: DashboardState) {
    return serializeDashboardExport(state);
  },

  async importData(raw: string) {
    const result = parseDashboardImport(raw);
    if (result.ok) saveDashboardState(result.state);
    return result;
  },

  todos: {
    async create(input: TodoInput): Promise<TodoItem> {
      const now = nowIso();
      const todo: TodoItem = {
        id: makeId("todo"),
        title: input.title,
        done: false,
        priority: input.priority,
        tags: input.tags,
        dueDate: input.dueDate,
        createdAt: now,
        updatedAt: now,
      };
      updateLocalState((current) => ({ ...current, todos: [todo, ...current.todos] }));
      return todo;
    },

    async update(id, patch) {
      const state = updateLocalState((current) => ({
        ...current,
        todos: current.todos.map((todo) =>
          todo.id === id ? { ...todo, ...patch, updatedAt: nowIso() } : todo,
        ),
      }));
      return findOrThrow(state.todos, id, "todo");
    },

    async delete(id) {
      updateLocalState((current) => ({ ...current, todos: current.todos.filter((todo) => todo.id !== id) }));
    },
  },

  learning: {
    async create(input: LearningInput) {
      const item = { id: makeId("learning"), ...input, updatedAt: nowIso() };
      updateLocalState((current) => ({ ...current, learningItems: [item, ...current.learningItems] }));
      return item;
    },

    async update(id, patch) {
      const state = updateLocalState((current) => ({
        ...current,
        learningItems: current.learningItems.map((item) =>
          item.id === id ? { ...item, ...patch, updatedAt: nowIso() } : item,
        ),
      }));
      return findOrThrow(state.learningItems, id, "learning item");
    },

    async delete(id) {
      updateLocalState((current) => ({
        ...current,
        learningItems: current.learningItems.filter((item) => item.id !== id),
      }));
    },
  },

  notes: {
    async create(input: NoteInput) {
      const note = { id: makeId("note"), ...input, updatedAt: nowIso() };
      updateLocalState((current) => ({ ...current, notes: [note, ...current.notes] }));
      return note;
    },

    async update(id, patch) {
      const state = updateLocalState((current) => ({
        ...current,
        notes: current.notes.map((note) =>
          note.id === id ? { ...note, ...patch, updatedAt: nowIso() } : note,
        ),
      }));
      return findOrThrow(state.notes, id, "note");
    },

    async delete(id) {
      updateLocalState((current) => ({ ...current, notes: current.notes.filter((note) => note.id !== id) }));
    },
  },

  goals: {
    async create(input: GoalInput): Promise<GoalItem> {
      const goal: GoalItem = { id: makeId("goal"), ...input, tasks: [] };
      updateLocalState((current) => ({ ...current, goals: [goal, ...current.goals] }));
      return goal;
    },

    async update(id, patch) {
      const state = updateLocalState((current) => ({
        ...current,
        goals: current.goals.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal)),
      }));
      return findOrThrow(state.goals, id, "goal");
    },

    async delete(id) {
      updateLocalState((current) => ({ ...current, goals: current.goals.filter((goal) => goal.id !== id) }));
    },

    async createTask(goalId: string, title: string): Promise<GoalTask> {
      const task: GoalTask = { id: makeId("goal-task"), title, done: false };
      updateLocalState((current) => ({
        ...current,
        goals: current.goals.map((goal) =>
          goal.id === goalId ? { ...goal, tasks: [task, ...goal.tasks] } : goal,
        ),
      }));
      return task;
    },

    async updateTask(goalId, taskId, patch) {
      const state = updateLocalState((current) => ({
        ...current,
        goals: current.goals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                tasks: goal.tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
              }
            : goal,
        ),
      }));
      const goal = findOrThrow(state.goals, goalId, "goal");
      return findOrThrow(goal.tasks, taskId, "goal task");
    },

    async deleteTask(goalId, taskId) {
      updateLocalState((current) => ({
        ...current,
        goals: current.goals.map((goal) =>
          goal.id === goalId ? { ...goal, tasks: goal.tasks.filter((task) => task.id !== taskId) } : goal,
        ),
      }));
    },
  },
};