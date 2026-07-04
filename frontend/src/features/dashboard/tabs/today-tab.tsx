"use client";

import { Activity, BookOpenCheck, CalendarClock, CheckSquare, NotebookText, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardEmptyState } from "@/features/dashboard/components/dashboard-empty-state";
import { DashboardPanelMotion } from "@/features/dashboard/components/dashboard-motion";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import type { DashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

const summaryCards = [
  { key: "openTodos", labelKey: "openTasks", icon: CheckSquare },
  { key: "activeLearning", labelKey: "activeLearning", icon: BookOpenCheck },
  { key: "noteCount", labelKey: "notes", icon: NotebookText },
  { key: "activeGoals", labelKey: "activeGoals", icon: Target },
] as const;

function readTimestamp(value: string) {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function readDueTimestamp(value: string | undefined) {
  if (!value) return null;
  const timestamp = new Date(`${value}T00:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function formatDate(value: string, locale: "en" | "zh") {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" });
}

export function TodayTab({ store }: { store: DashboardStore }) {
  const { locale } = useLocale();
  const t = copy[locale].dashboard.today;
  const todoCopy = copy[locale].dashboard.todo;
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);

  const dueSoonTodos = store.state.todos
    .filter((todo) => !todo.done)
    .filter((todo) => {
      const dueTimestamp = readDueTimestamp(todo.dueDate);
      return dueTimestamp !== null && dueTimestamp <= weekEnd.getTime();
    })
    .sort((a, b) => (readDueTimestamp(a.dueDate) ?? 0) - (readDueTimestamp(b.dueDate) ?? 0))
    .slice(0, 5);

  const recentLearning = [...store.state.learningItems]
    .sort((a, b) => readTimestamp(b.updatedAt) - readTimestamp(a.updatedAt))
    .slice(0, 3);

  const recentNotes = [...store.state.notes]
    .sort((a, b) => readTimestamp(b.updatedAt) - readTimestamp(a.updatedAt))
    .slice(0, 3);

  const nextTodo = dueSoonTodos[0] ?? store.state.todos.find((todo) => !todo.done);
  const activeLearning = recentLearning.find((item) => item.status === "active") ?? recentLearning[0];
  const primaryGoal = store.state.goals.find((goal) => goal.status === "active") ?? store.state.goals[0];
  const completedGoalTasks = primaryGoal?.tasks.filter((task) => task.done).length ?? 0;

  return (
    <div className="grid gap-5">
      <DashboardPanelMotion>
        <DashboardSection title={t.cockpit} description={t.cockpitDescription} icon={Activity} contentClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="rounded-md border bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{t[item.labelKey]}</p>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-3 text-3xl font-semibold">{store.summary[item.key]}</p>
              </div>
            );
          })}
        </DashboardSection>
      </DashboardPanelMotion>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardPanelMotion>
          <DashboardSection title={t.focus} description={nextTodo ? t.weekWindow : t.focusEmpty} icon={Target} contentClassName="grid gap-3">
            {nextTodo ? (
              <div className="rounded-md border bg-background/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium", nextTodo.done && "text-muted-foreground line-through")}>{nextTodo.title}</p>
                    {nextTodo.dueDate ? <p className="mt-2 text-xs text-muted-foreground">{todoCopy.due}: {formatDate(nextTodo.dueDate, locale)}</p> : null}
                  </div>
                  <Badge variant={nextTodo.priority === "high" ? "default" : "secondary"}>{todoCopy.priorityLabels[nextTodo.priority]}</Badge>
                </div>
              </div>
            ) : (
              <DashboardEmptyState title={t.focusEmpty} description={t.emptyQueue} icon={CheckSquare} />
            )}

            {activeLearning ? (
              <div className="rounded-md border bg-background/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{activeLearning.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{activeLearning.area}</p>
                  </div>
                  <Badge variant={activeLearning.status === "active" ? "default" : "secondary"}>{activeLearning.status}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={activeLearning.progress} className="flex-1" />
                  <span className="w-12 text-right text-xs font-medium">{activeLearning.progress}%</span>
                </div>
              </div>
            ) : null}
          </DashboardSection>
        </DashboardPanelMotion>

        <DashboardPanelMotion>
          <DashboardSection title={t.dueSoon} icon={CalendarClock} action={<Badge variant="outline">{t.weekWindow}</Badge>} contentClassName="grid gap-3">
            {dueSoonTodos.map((todo) => (
              <div key={todo.id} className="rounded-md border bg-background/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{todo.title}</p>
                  <Badge variant={todo.priority === "high" ? "default" : "secondary"}>{todoCopy.priorityLabels[todo.priority]}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{todoCopy.due}: {formatDate(todo.dueDate ?? "", locale)}</p>
              </div>
            ))}
            {dueSoonTodos.length === 0 ? <DashboardEmptyState title={t.noDueSoon} icon={CalendarClock} /> : null}
          </DashboardSection>
        </DashboardPanelMotion>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <DashboardPanelMotion>
          <DashboardSection title={t.recentLearning} icon={BookOpenCheck} contentClassName="grid gap-3">
            {recentLearning.map((item) => (
              <div key={item.id} className="rounded-md border bg-background/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  <Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.area}</p>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={item.progress} className="flex-1" />
                  <span className="w-12 text-right text-xs font-medium">{item.progress}%</span>
                </div>
              </div>
            ))}
            {recentLearning.length === 0 ? <DashboardEmptyState title={t.noLearning} icon={BookOpenCheck} /> : null}
          </DashboardSection>
        </DashboardPanelMotion>

        <DashboardPanelMotion>
          <DashboardSection title={t.recentNotes} icon={NotebookText} contentClassName="grid gap-3">
            {recentNotes.map((note) => (
              <div key={note.id} className="rounded-md border bg-background/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{note.title}</p>
                  <Badge variant="outline">{note.category}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{note.body || t.emptyNote}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t.updated} {new Date(note.updatedAt).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US")}
                </p>
              </div>
            ))}
            {recentNotes.length === 0 ? <DashboardEmptyState title={t.noNotes} icon={NotebookText} /> : null}
          </DashboardSection>
        </DashboardPanelMotion>

        <DashboardPanelMotion>
          <DashboardSection title={t.primaryGoal} icon={Target} contentClassName="grid gap-4">
            {primaryGoal ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{primaryGoal.title}</p>
                  <span className="text-sm text-muted-foreground">{primaryGoal.progress}%</span>
                </div>
                <Progress value={primaryGoal.progress} />
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>{t.status}: {primaryGoal.status}</span>
                  <span>{t.goalTasks}: {completedGoalTasks}/{primaryGoal.tasks.length}</span>
                </div>
                <div className="grid gap-2">
                  {primaryGoal.tasks.slice(0, 4).map((task) => (
                    <div key={task.id} className="flex items-center gap-2 rounded-md border bg-background/70 px-3 py-2 text-sm">
                      <input type="checkbox" checked={task.done} readOnly aria-label={task.title} className="h-4 w-4 accent-primary" />
                      <span className={task.done ? "text-muted-foreground line-through" : undefined}>{task.title}</span>
                    </div>
                  ))}
                  {primaryGoal.tasks.length === 0 ? <DashboardEmptyState title={t.noGoalTasks} icon={Target} /> : null}
                </div>
              </>
            ) : (
              <DashboardEmptyState title={t.noGoals} icon={Target} />
            )}
          </DashboardSection>
        </DashboardPanelMotion>
      </div>
    </div>
  );
}
