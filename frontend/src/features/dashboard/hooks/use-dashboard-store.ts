"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  loadDashboardState,
  parseDashboardImport,
  resetDashboardState,
  saveDashboardState,
  serializeDashboardExport,
} from "@/features/dashboard/data/local-storage-dashboard-repository";
import type {
  DashboardState,
  DashboardTab,
  GoalInput,
  GoalPatch,
  LearningInput,
  LearningPatch,
  NoteInput,
  NotePatch,
  TodoInput,
  TodoPatch,
} from "@/features/dashboard/types";
import { applyTheme, type ThemePreference } from "@/lib/theme/theme-provider";

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function hashPasscode(value: string) {
  let hash = 5381;
  for (const char of value) {
    hash = (hash * 33) ^ char.charCodeAt(0);
  }
  return `local-${(hash >>> 0).toString(16)}`;
}

function cleanTags(tags: string[]) {
  const seen = new Set<string>();
  return tags
    .map((tag) => tag.trim())
    .filter((tag) => {
      if (!tag || seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });
}

function cleanOptionalString(value: string | undefined) {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function cleanString(value: string, fallback: string) {
  const trimmed = value.trim();
  return trimmed || fallback;
}

function clampProgress(value: number) {
  return Math.min(100, Math.max(0, value));
}

function hasPatchKey(patch: object, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(patch, key);
}

export function useDashboardStore() {
  const hydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const [state, setState] = useState<DashboardState>(() => loadDashboardState());

  useEffect(() => {
    applyTheme(state.preferences.theme);
  }, [state.preferences.theme]);

  const commit = useCallback((update: (current: DashboardState) => DashboardState) => {
    setState((current) => {
      const next = update(current);
      saveDashboardState(next);
      applyTheme(next.preferences.theme);
      return next;
    });
  }, []);

  const hasPasscode = Boolean(state.access.passcodeHash);
  const activeTab = state.preferences.activeTab;

  const createPasscode = useCallback((passcode: string) => {
    const trimmed = passcode.trim();
    if (trimmed.length < 4) return false;
    commit((current) => ({
      ...current,
      access: {
        passcodeHash: hashPasscode(trimmed),
        unlocked: true,
      },
    }));
    return true;
  }, [commit]);

  const unlock = useCallback((passcode: string) => {
    const trimmed = passcode.trim();
    if (!state.access.passcodeHash || hashPasscode(trimmed) !== state.access.passcodeHash) return false;
    setState((current) => ({ ...current, access: { ...current.access, unlocked: true } }));
    return true;
  }, [state.access.passcodeHash]);

  const lock = useCallback(() => {
    setState((current) => ({ ...current, access: { ...current.access, unlocked: false } }));
  }, []);

  const setActiveTab = useCallback((tab: DashboardTab) => {
    commit((current) => ({ ...current, preferences: { ...current.preferences, activeTab: tab } }));
  }, [commit]);

  const setTheme = useCallback((theme: ThemePreference) => {
    commit((current) => ({ ...current, preferences: { ...current.preferences, theme } }));
  }, [commit]);

  const addTodo = useCallback((input: TodoInput) => {
    const title = input.title.trim();
    if (!title) return;
    const now = new Date().toISOString();
    commit((current) => ({
      ...current,
      todos: [
        {
          id: makeId("todo"),
          title,
          done: false,
          priority: input.priority,
          tags: cleanTags(input.tags),
          dueDate: cleanOptionalString(input.dueDate),
          createdAt: now,
          updatedAt: now,
        },
        ...current.todos,
      ],
    }));
  }, [commit]);

  const updateTodo = useCallback((id: string, patch: TodoPatch) => {
    commit((current) => ({
      ...current,
      todos: current.todos.map((todo) => {
        if (todo.id !== id) return todo;
        const nextTitle = patch.title === undefined ? todo.title : patch.title.trim();
        if (!nextTitle) return todo;
        return {
          ...todo,
          title: nextTitle,
          done: patch.done ?? todo.done,
          priority: patch.priority ?? todo.priority,
          tags: patch.tags === undefined ? todo.tags : cleanTags(patch.tags),
          dueDate: hasPatchKey(patch, "dueDate") ? cleanOptionalString(patch.dueDate) : todo.dueDate,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, [commit]);

  const toggleTodo = useCallback((id: string) => {
    commit((current) => ({
      ...current,
      todos: current.todos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done, updatedAt: new Date().toISOString() } : todo,
      ),
    }));
  }, [commit]);

  const deleteTodo = useCallback((id: string) => {
    commit((current) => ({ ...current, todos: current.todos.filter((todo) => todo.id !== id) }));
  }, [commit]);

  const addLearningItem = useCallback((input: LearningInput) => {
    const title = input.title.trim();
    if (!title) return;
    commit((current) => ({
      ...current,
      learningItems: [
        {
          id: makeId("learning"),
          title,
          area: cleanString(input.area, "General"),
          status: input.status,
          progress: clampProgress(input.progress),
          notes: input.notes,
          tags: cleanTags(input.tags),
          updatedAt: new Date().toISOString(),
        },
        ...current.learningItems,
      ],
    }));
  }, [commit]);

  const updateLearningItem = useCallback((id: string, patch: LearningPatch) => {
    commit((current) => ({
      ...current,
      learningItems: current.learningItems.map((item) => {
        if (item.id !== id) return item;
        const nextTitle = patch.title === undefined ? item.title : patch.title.trim();
        if (!nextTitle) return item;
        return {
          ...item,
          title: nextTitle,
          area: patch.area === undefined ? item.area : cleanString(patch.area, "General"),
          status: patch.status ?? item.status,
          progress: patch.progress === undefined ? item.progress : clampProgress(patch.progress),
          notes: patch.notes ?? item.notes,
          tags: patch.tags === undefined ? item.tags : cleanTags(patch.tags),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, [commit]);

  const addNote = useCallback((input: NoteInput) => {
    const title = input.title.trim();
    if (!title) return;
    commit((current) => ({
      ...current,
      notes: [
        {
          id: makeId("note"),
          title,
          body: input.body,
          category: cleanString(input.category, "General"),
          tags: cleanTags(input.tags),
          updatedAt: new Date().toISOString(),
        },
        ...current.notes,
      ],
    }));
  }, [commit]);

  const updateNote = useCallback((id: string, patch: NotePatch) => {
    commit((current) => ({
      ...current,
      notes: current.notes.map((note) => {
        if (note.id !== id) return note;
        const nextTitle = patch.title === undefined ? note.title : patch.title.trim();
        if (!nextTitle) return note;
        return {
          ...note,
          title: nextTitle,
          body: patch.body ?? note.body,
          category: patch.category === undefined ? note.category : cleanString(patch.category, "General"),
          tags: patch.tags === undefined ? note.tags : cleanTags(patch.tags),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, [commit]);

  const addGoal = useCallback((input: GoalInput) => {
    const title = input.title.trim();
    if (!title) return;
    commit((current) => ({
      ...current,
      goals: [
        {
          id: makeId("goal"),
          title,
          progress: clampProgress(input.progress),
          status: input.status,
          targetYear: cleanOptionalString(input.targetYear),
          tasks: [],
        },
        ...current.goals,
      ],
    }));
  }, [commit]);

  const updateGoal = useCallback((id: string, patch: GoalPatch) => {
    commit((current) => ({
      ...current,
      goals: current.goals.map((goal) => {
        if (goal.id !== id) return goal;
        const nextTitle = patch.title === undefined ? goal.title : patch.title.trim();
        if (!nextTitle) return goal;
        return {
          ...goal,
          title: nextTitle,
          progress: patch.progress === undefined ? goal.progress : clampProgress(patch.progress),
          status: patch.status ?? goal.status,
          targetYear: hasPatchKey(patch, "targetYear") ? cleanOptionalString(patch.targetYear) : goal.targetYear,
        };
      }),
    }));
  }, [commit]);

  const addGoalTask = useCallback((goalId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    commit((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === goalId
          ? { ...goal, tasks: [{ id: makeId("goal-task"), title: trimmed, done: false }, ...goal.tasks] }
          : goal,
      ),
    }));
  }, [commit]);

  const toggleGoalTask = useCallback((goalId: string, taskId: string) => {
    commit((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === goalId
          ? { ...goal, tasks: goal.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)) }
          : goal,
      ),
    }));
  }, [commit]);

  const deleteGoalTask = useCallback((goalId: string, taskId: string) => {
    commit((current) => ({
      ...current,
      goals: current.goals.map((goal) =>
        goal.id === goalId ? { ...goal, tasks: goal.tasks.filter((task) => task.id !== taskId) } : goal,
      ),
    }));
  }, [commit]);

  const updatePasscode = useCallback((passcode: string) => createPasscode(passcode), [createPasscode]);

  const clearData = useCallback(() => {
    const reset = resetDashboardState();
    setState(reset);
    applyTheme(reset.preferences.theme);
  }, []);

  const exportDashboardData = useCallback(() => serializeDashboardExport(state), [state]);

  const importDashboardData = useCallback((raw: string) => {
    const result = parseDashboardImport(raw);
    if (!result.ok) return result;

    const nextState: DashboardState = {
      ...result.state,
      access: {
        ...result.state.access,
        unlocked: true,
      },
    };

    saveDashboardState(nextState);
    setState(nextState);
    applyTheme(nextState.preferences.theme);
    return { ok: true, state: nextState } as const;
  }, []);

  const summary = useMemo(() => {
    const openTodos = state.todos.filter((todo) => !todo.done).length;
    const activeLearning = state.learningItems.filter((item) => item.status === "active").length;
    const activeGoals = state.goals.filter((goal) => goal.status === "active").length;
    return {
      openTodos,
      activeLearning,
      noteCount: state.notes.length,
      activeGoals,
    };
  }, [state.goals, state.learningItems, state.notes.length, state.todos]);

  return {
    state,
    hydrated,
    hasPasscode,
    activeTab,
    summary,
    createPasscode,
    unlock,
    lock,
    setActiveTab,
    setTheme,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    addLearningItem,
    updateLearningItem,
    addNote,
    updateNote,
    addGoal,
    updateGoal,
    addGoalTask,
    toggleGoalTask,
    deleteGoalTask,
    updatePasscode,
    clearData,
    exportDashboardData,
    importDashboardData,
  };
}

export type DashboardStore = ReturnType<typeof useDashboardStore>;