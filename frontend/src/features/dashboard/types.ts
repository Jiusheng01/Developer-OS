import type { ThemePreference } from "@/lib/theme/theme-provider";

export type DashboardTab = "today" | "todo" | "learning" | "notes" | "goals" | "settings";

export type TodoPriority = "low" | "medium" | "high";

export type TodoItem = {
  id: string;
  title: string;
  done: boolean;
  priority: TodoPriority;
  tags: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
};

export type TodoInput = {
  title: string;
  priority: TodoPriority;
  tags: string[];
  dueDate?: string;
};

export type TodoPatch = Partial<Pick<TodoItem, "title" | "done" | "priority" | "tags" | "dueDate">>;

export type LearningStatus = "queued" | "active" | "review" | "done";

export type LearningItem = {
  id: string;
  title: string;
  area: string;
  status: LearningStatus;
  progress: number;
  notes: string;
  tags: string[];
  updatedAt: string;
};

export type LearningInput = Pick<LearningItem, "title" | "area" | "status" | "progress" | "notes" | "tags">;

export type LearningPatch = Partial<LearningInput>;

export type NoteItem = {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  updatedAt: string;
};

export type NoteInput = Pick<NoteItem, "title" | "body" | "category" | "tags">;

export type NotePatch = Partial<NoteInput>;

export type GoalStatus = "planned" | "active" | "done";

export type GoalTask = {
  id: string;
  title: string;
  done: boolean;
};

export type GoalItem = {
  id: string;
  title: string;
  progress: number;
  status: GoalStatus;
  targetYear?: string;
  tasks: GoalTask[];
};

export type GoalInput = Pick<GoalItem, "title" | "progress" | "status" | "targetYear">;

export type GoalPatch = Partial<GoalInput>;

export type DashboardState = {
  version: 2;
  access: {
    unlocked: boolean;
  };
  preferences: {
    theme: ThemePreference;
    activeTab: DashboardTab;
  };
  todos: TodoItem[];
  learningItems: LearningItem[];
  notes: NoteItem[];
  goals: GoalItem[];
};

export type DashboardExport = {
  exportedAt: string;
  source: "developer-os";
  state: DashboardState;
};

export type DashboardImportError = "empty" | "invalid-json" | "invalid-source" | "invalid-shape";

export type DashboardImportResult =
  | { ok: true; state: DashboardState }
  | { ok: false; error: DashboardImportError };
