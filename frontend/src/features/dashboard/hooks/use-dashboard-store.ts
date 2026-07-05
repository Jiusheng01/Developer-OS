"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createDefaultDashboardState } from "@/features/dashboard/data/dashboard-defaults";
import {
  type DashboardDataSnapshot,
  stateWithSnapshot,
} from "@/features/dashboard/data/dashboard-data-provider";
import {
  loadDashboardPreferences,
  saveDashboardPreferences,
} from "@/features/dashboard/data/dashboard-preferences-repository";
import {
  getDashboardDataProvider,
  getDashboardDataProviderMode,
} from "@/features/dashboard/data/provider-config";
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Dashboard data provider failed";
}

const EMPTY_DASHBOARD_SNAPSHOT = {
  todos: [],
  learningItems: [],
  notes: [],
  goals: [],
} satisfies DashboardDataSnapshot;

function createInitialDashboardState(): DashboardState {
  return stateWithSnapshot(
    {
      ...createDefaultDashboardState(),
      preferences: loadDashboardPreferences(),
    },
    EMPTY_DASHBOARD_SNAPSHOT,
  );
}

export function useDashboardStore() {
  const browserHydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const provider = useMemo(() => getDashboardDataProvider(), []);
  const providerMode = useMemo(() => getDashboardDataProviderMode(), []);
  const [state, setState] = useState<DashboardState>(() => createInitialDashboardState());
  const [dataHydrated, setDataHydrated] = useState(false);
  const [dataError, setDataError] = useState<string | undefined>();
  const [mutationCount, setMutationCount] = useState(0);

  const persistPreferences = useCallback((preferences: DashboardState["preferences"]) => {
    saveDashboardPreferences(preferences);
    applyTheme(preferences.theme);
  }, []);

  useEffect(() => {
    applyTheme(state.preferences.theme);
  }, [state.preferences.theme]);

  useEffect(() => {
    if (!browserHydrated) return;
    let cancelled = false;

    async function loadProviderData() {
      setDataHydrated(false);
      setDataError(undefined);
      try {
        const snapshot = await provider.loadData();
        if (cancelled) return;
        setState((current) => {
          const next = stateWithSnapshot(current, snapshot);
          return next;
        });
      } catch (error) {
        if (!cancelled) setDataError(getErrorMessage(error));
      } finally {
        if (!cancelled) setDataHydrated(true);
      }
    }

    void loadProviderData();
    return () => {
      cancelled = true;
    };
  }, [browserHydrated, provider]);

  const commitLocal = useCallback((update: (current: DashboardState) => DashboardState) => {
    setState((current) => {
      const next = update(current);
      persistPreferences(next.preferences);
      return next;
    });
  }, [persistPreferences]);

  const commitBusiness = useCallback((update: (current: DashboardState) => DashboardState) => {
    setState((current) => {
      return update(current);
    });
  }, []);

  const reloadData = useCallback(async () => {
    setDataHydrated(false);
    setDataError(undefined);
    try {
      const snapshot = await provider.loadData();
      setState((current) => stateWithSnapshot(current, snapshot));
    } catch (error) {
      setDataError(getErrorMessage(error));
    } finally {
      setDataHydrated(true);
    }
  }, [provider]);

  const runProviderAction = useCallback(async (action: () => Promise<void>) => {
    setDataError(undefined);
    setMutationCount((count) => count + 1);
    try {
      await action();
    } catch (error) {
      setDataError(getErrorMessage(error));
    } finally {
      setMutationCount((count) => Math.max(0, count - 1));
    }
  }, []);

  const activeTab = state.preferences.activeTab;

  const setActiveTab = useCallback((tab: DashboardTab) => {
    commitLocal((current) => ({ ...current, preferences: { ...current.preferences, activeTab: tab } }));
  }, [commitLocal]);

  const setTheme = useCallback((theme: ThemePreference) => {
    commitLocal((current) => ({ ...current, preferences: { ...current.preferences, theme } }));
  }, [commitLocal]);

  const addTodo = useCallback((input: TodoInput) => {
    const title = input.title.trim();
    if (!title) return;
    const payload: TodoInput = {
      title,
      priority: input.priority,
      tags: cleanTags(input.tags),
      dueDate: cleanOptionalString(input.dueDate),
    };
    void runProviderAction(async () => {
      const todo = await provider.todos.create(payload);
      commitBusiness((current) => ({ ...current, todos: [todo, ...current.todos.filter((item) => item.id !== todo.id)] }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const updateTodo = useCallback((id: string, patch: TodoPatch) => {
    const payload: TodoPatch = {};
    if (patch.title !== undefined) {
      const title = patch.title.trim();
      if (!title) return;
      payload.title = title;
    }
    if (patch.done !== undefined) payload.done = patch.done;
    if (patch.priority !== undefined) payload.priority = patch.priority;
    if (patch.tags !== undefined) payload.tags = cleanTags(patch.tags);
    if (hasPatchKey(patch, "dueDate")) payload.dueDate = cleanOptionalString(patch.dueDate);

    void runProviderAction(async () => {
      const todo = await provider.todos.update(id, payload);
      commitBusiness((current) => ({
        ...current,
        todos: current.todos.map((item) => (item.id === id ? todo : item)),
      }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const toggleTodo = useCallback((id: string) => {
    const todo = state.todos.find((item) => item.id === id);
    if (!todo) return;
    updateTodo(id, { done: !todo.done });
  }, [state.todos, updateTodo]);

  const deleteTodo = useCallback((id: string) => {
    void runProviderAction(async () => {
      await provider.todos.delete(id);
      commitBusiness((current) => ({ ...current, todos: current.todos.filter((todo) => todo.id !== id) }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const addLearningItem = useCallback((input: LearningInput) => {
    const title = input.title.trim();
    if (!title) return;
    const payload: LearningInput = {
      title,
      area: cleanString(input.area, "General"),
      status: input.status,
      progress: clampProgress(input.progress),
      notes: input.notes,
      tags: cleanTags(input.tags),
    };
    void runProviderAction(async () => {
      const item = await provider.learning.create(payload);
      commitBusiness((current) => ({
        ...current,
        learningItems: [item, ...current.learningItems.filter((existing) => existing.id !== item.id)],
      }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const updateLearningItem = useCallback((id: string, patch: LearningPatch) => {
    const payload: LearningPatch = {};
    if (patch.title !== undefined) {
      const title = patch.title.trim();
      if (!title) return;
      payload.title = title;
    }
    if (patch.area !== undefined) payload.area = cleanString(patch.area, "General");
    if (patch.status !== undefined) payload.status = patch.status;
    if (patch.progress !== undefined) payload.progress = clampProgress(patch.progress);
    if (patch.notes !== undefined) payload.notes = patch.notes;
    if (patch.tags !== undefined) payload.tags = cleanTags(patch.tags);

    void runProviderAction(async () => {
      const item = await provider.learning.update(id, payload);
      commitBusiness((current) => ({
        ...current,
        learningItems: current.learningItems.map((existing) => (existing.id === id ? item : existing)),
      }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const deleteLearningItem = useCallback((id: string) => {
    void runProviderAction(async () => {
      await provider.learning.delete(id);
      commitBusiness((current) => ({
        ...current,
        learningItems: current.learningItems.filter((item) => item.id !== id),
      }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const addNote = useCallback((input: NoteInput) => {
    const title = input.title.trim();
    if (!title) return;
    const payload: NoteInput = {
      title,
      body: input.body,
      category: cleanString(input.category, "General"),
      tags: cleanTags(input.tags),
    };
    void runProviderAction(async () => {
      const note = await provider.notes.create(payload);
      commitBusiness((current) => ({ ...current, notes: [note, ...current.notes.filter((item) => item.id !== note.id)] }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const updateNote = useCallback((id: string, patch: NotePatch) => {
    const payload: NotePatch = {};
    if (patch.title !== undefined) {
      const title = patch.title.trim();
      if (!title) return;
      payload.title = title;
    }
    if (patch.body !== undefined) payload.body = patch.body;
    if (patch.category !== undefined) payload.category = cleanString(patch.category, "General");
    if (patch.tags !== undefined) payload.tags = cleanTags(patch.tags);

    void runProviderAction(async () => {
      const note = await provider.notes.update(id, payload);
      commitBusiness((current) => ({
        ...current,
        notes: current.notes.map((existing) => (existing.id === id ? note : existing)),
      }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const deleteNote = useCallback((id: string) => {
    void runProviderAction(async () => {
      await provider.notes.delete(id);
      commitBusiness((current) => ({ ...current, notes: current.notes.filter((note) => note.id !== id) }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const addGoal = useCallback((input: GoalInput) => {
    const title = input.title.trim();
    if (!title) return;
    const payload: GoalInput = {
      title,
      progress: clampProgress(input.progress),
      status: input.status,
      targetYear: cleanOptionalString(input.targetYear),
    };
    void runProviderAction(async () => {
      const goal = await provider.goals.create(payload);
      commitBusiness((current) => ({ ...current, goals: [goal, ...current.goals.filter((item) => item.id !== goal.id)] }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const updateGoal = useCallback((id: string, patch: GoalPatch) => {
    const payload: GoalPatch = {};
    if (patch.title !== undefined) {
      const title = patch.title.trim();
      if (!title) return;
      payload.title = title;
    }
    if (patch.progress !== undefined) payload.progress = clampProgress(patch.progress);
    if (patch.status !== undefined) payload.status = patch.status;
    if (hasPatchKey(patch, "targetYear")) payload.targetYear = cleanOptionalString(patch.targetYear);

    void runProviderAction(async () => {
      const goal = await provider.goals.update(id, payload);
      commitBusiness((current) => ({
        ...current,
        goals: current.goals.map((existing) => (existing.id === id ? goal : existing)),
      }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const deleteGoal = useCallback((id: string) => {
    void runProviderAction(async () => {
      await provider.goals.delete(id);
      commitBusiness((current) => ({ ...current, goals: current.goals.filter((goal) => goal.id !== id) }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const addGoalTask = useCallback((goalId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    void runProviderAction(async () => {
      const task = await provider.goals.createTask(goalId, trimmed);
      commitBusiness((current) => ({
        ...current,
        goals: current.goals.map((goal) =>
          goal.id === goalId ? { ...goal, tasks: [task, ...goal.tasks.filter((item) => item.id !== task.id)] } : goal,
        ),
      }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const toggleGoalTask = useCallback((goalId: string, taskId: string) => {
    const goal = state.goals.find((item) => item.id === goalId);
    const task = goal?.tasks.find((item) => item.id === taskId);
    if (!task) return;
    void runProviderAction(async () => {
      const updatedTask = await provider.goals.updateTask(goalId, taskId, { done: !task.done });
      commitBusiness((current) => ({
        ...current,
        goals: current.goals.map((currentGoal) =>
          currentGoal.id === goalId
            ? {
                ...currentGoal,
                tasks: currentGoal.tasks.map((currentTask) =>
                  currentTask.id === taskId ? updatedTask : currentTask,
                ),
              }
            : currentGoal,
        ),
      }));
    });
  }, [commitBusiness, provider, runProviderAction, state.goals]);

  const deleteGoalTask = useCallback((goalId: string, taskId: string) => {
    void runProviderAction(async () => {
      await provider.goals.deleteTask(goalId, taskId);
      commitBusiness((current) => ({
        ...current,
        goals: current.goals.map((goal) =>
          goal.id === goalId ? { ...goal, tasks: goal.tasks.filter((task) => task.id !== taskId) } : goal,
        ),
      }));
    });
  }, [commitBusiness, provider, runProviderAction]);

  const clearData = useCallback(() => {
    void runProviderAction(async () => {
      const snapshot = await provider.resetData();
      setState((current) =>
        stateWithSnapshot(
          {
            ...createDefaultDashboardState(),
            preferences: current.preferences,
          },
          snapshot,
        ),
      );
    });
  }, [provider, runProviderAction]);

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
    hydrated: browserHydrated && dataHydrated,
    dataError,
    isMutating: mutationCount > 0,
    providerMode,
    activeTab,
    summary,
    reloadData,
    setActiveTab,
    setTheme,
    addTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    addLearningItem,
    updateLearningItem,
    deleteLearningItem,
    addNote,
    updateNote,
    deleteNote,
    addGoal,
    updateGoal,
    deleteGoal,
    addGoalTask,
    toggleGoalTask,
    deleteGoalTask,
    clearData,
  };
}

export type DashboardStore = ReturnType<typeof useDashboardStore>;
