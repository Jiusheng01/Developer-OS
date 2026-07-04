import type {
  DashboardImportResult,
  DashboardState,
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

export type DashboardDataSnapshot = Pick<DashboardState, "todos" | "learningItems" | "notes" | "goals">;

export type GoalTaskPatch = Partial<Pick<GoalTask, "title" | "done">>;

export type TodoDataPort = {
  create(input: TodoInput): Promise<TodoItem>;
  update(id: string, patch: TodoPatch): Promise<TodoItem>;
  delete(id: string): Promise<void>;
};

export type LearningDataPort = {
  create(input: LearningInput): Promise<LearningItem>;
  update(id: string, patch: LearningPatch): Promise<LearningItem>;
  delete(id: string): Promise<void>;
};

export type NotesDataPort = {
  create(input: NoteInput): Promise<NoteItem>;
  update(id: string, patch: NotePatch): Promise<NoteItem>;
  delete(id: string): Promise<void>;
};

export type GoalsDataPort = {
  create(input: GoalInput): Promise<GoalItem>;
  update(id: string, patch: GoalPatch): Promise<GoalItem>;
  delete(id: string): Promise<void>;
  createTask(goalId: string, title: string): Promise<GoalTask>;
  updateTask(goalId: string, taskId: string, patch: GoalTaskPatch): Promise<GoalTask>;
  deleteTask(goalId: string, taskId: string): Promise<void>;
};

export type DashboardDataProvider = {
  loadData(): Promise<DashboardDataSnapshot>;
  resetData(): Promise<DashboardDataSnapshot>;
  exportData(state: DashboardState): Promise<string>;
  importData(raw: string): Promise<DashboardImportResult>;
  todos: TodoDataPort;
  learning: LearningDataPort;
  notes: NotesDataPort;
  goals: GoalsDataPort;
};

export function snapshotFromState(state: DashboardState): DashboardDataSnapshot {
  return {
    todos: state.todos,
    learningItems: state.learningItems,
    notes: state.notes,
    goals: state.goals,
  };
}

export function stateWithSnapshot(state: DashboardState, snapshot: DashboardDataSnapshot): DashboardState {
  return {
    ...state,
    todos: snapshot.todos,
    learningItems: snapshot.learningItems,
    notes: snapshot.notes,
    goals: snapshot.goals,
  };
}