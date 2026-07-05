import type { DashboardState } from "@/features/dashboard/types";

export function createDefaultDashboardState(): DashboardState {
  const now = new Date().toISOString();

  return {
    version: 2,
    access: {
      unlocked: false,
    },
    preferences: {
      theme: "dark",
      activeTab: "today",
    },
    todos: [
      {
        id: "todo-v1-public-shell",
        title: "Review the public Developer OS pages",
        done: false,
        priority: "medium",
        tags: ["public", "review"],
        dueDate: undefined,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "todo-v1-learning",
        title: "Update learning tracks after the first build",
        done: false,
        priority: "high",
        tags: ["learning"],
        dueDate: undefined,
        createdAt: now,
        updatedAt: now,
      },
    ],
    learningItems: [
      {
        id: "learn-next-app-router",
        title: "Next.js App Router product structure",
        area: "Frontend Architecture",
        status: "active",
        progress: 65,
        notes: "Keep route files thin and move domain logic into feature modules.",
        tags: ["nextjs", "architecture"],
        updatedAt: now,
      },
      {
        id: "learn-ai-workflows",
        title: "AI engineering workflow patterns",
        area: "AI Engineering",
        status: "active",
        progress: 42,
        notes: "Use the Developer OS as a real workspace for studying AI workflow design.",
        tags: ["ai", "workflow"],
        updatedAt: now,
      },
      {
        id: "learn-fastapi-boundary",
        title: "FastAPI repository boundary planning",
        area: "Backend Systems",
        status: "queued",
        progress: 18,
        notes: "Keep local repositories replaceable before adding a backend.",
        tags: ["fastapi", "backend"],
        updatedAt: now,
      },
    ],
    notes: [
      {
        id: "note-v3-scope",
        title: "V3 scope",
        body: "Keep public pages static-data driven while Dashboard business data is account-backed through FastAPI.",
        category: "Architecture",
        tags: ["v3", "api"],
        updatedAt: now,
      },
    ],
    goals: [
      {
        id: "goal-ship-v1",
        title: "Ship Developer OS v1",
        progress: 35,
        status: "active",
        targetYear: "2026",
        tasks: [
          { id: "goal-task-schema", title: "Stabilize local dashboard schema", done: false },
          { id: "goal-task-todo", title: "Make Todo useful for daily execution", done: false },
        ],
      },
    ],
  };
}
