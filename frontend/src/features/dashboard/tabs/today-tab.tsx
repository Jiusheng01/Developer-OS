"use client";

import { BookOpenCheck, CalendarClock, CheckSquare, NotebookText, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DashboardPanelMotion } from "@/features/dashboard/components/dashboard-motion";
import type { DashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";

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

  const primaryGoal = store.state.goals.find((goal) => goal.status === "active") ?? store.state.goals[0];
  const completedGoalTasks = primaryGoal?.tasks.filter((task) => task.done).length ?? 0;

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;
          return (
            <DashboardPanelMotion key={item.key}>
              <Card>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t[item.labelKey]}</p>
                    <p className="mt-2 text-3xl font-semibold">{store.summary[item.key]}</p>
                  </div>
                  <Icon className="h-6 w-6 text-primary" />
                </CardContent>
              </Card>
            </DashboardPanelMotion>
          );
        })}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <DashboardPanelMotion>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t.dueSoon}</CardTitle>
              <CalendarClock className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="grid gap-3">
              {dueSoonTodos.map((todo) => (
                <div key={todo.id} className="rounded-md border bg-background p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">{todo.title}</p>
                    <Badge variant={todo.priority === "high" ? "default" : "secondary"}>{todoCopy.priorityLabels[todo.priority]}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{todoCopy.due}: {formatDate(todo.dueDate ?? "", locale)}</p>
                </div>
              ))}
              {dueSoonTodos.length === 0 ? <p className="text-sm text-muted-foreground">{t.noDueSoon}</p> : null}
            </CardContent>
          </Card>
        </DashboardPanelMotion>
        <DashboardPanelMotion>
          <Card>
            <CardHeader>
              <CardTitle>{t.recentLearning}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {recentLearning.map((item) => (
                <div key={item.id} className="rounded-md border bg-background p-3">
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
              {recentLearning.length === 0 ? <p className="text-sm text-muted-foreground">{t.noLearning}</p> : null}
            </CardContent>
          </Card>
        </DashboardPanelMotion>
        <DashboardPanelMotion>
          <Card>
            <CardHeader>
              <CardTitle>{t.recentNotes}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {recentNotes.map((note) => (
                <div key={note.id} className="rounded-md border bg-background p-3">
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
              {recentNotes.length === 0 ? <p className="text-sm text-muted-foreground">{t.noNotes}</p> : null}
            </CardContent>
          </Card>
        </DashboardPanelMotion>
        <DashboardPanelMotion>
          <Card>
            <CardHeader>
              <CardTitle>{t.primaryGoal}</CardTitle>
            </CardHeader>
            <CardContent>
              {primaryGoal ? (
                <div className="grid gap-4">
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
                      <div key={task.id} className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                        <input type="checkbox" checked={task.done} readOnly aria-label={task.title} className="h-4 w-4 accent-primary" />
                        <span className={task.done ? "text-muted-foreground line-through" : undefined}>{task.title}</span>
                      </div>
                    ))}
                    {primaryGoal.tasks.length === 0 ? <p className="text-sm text-muted-foreground">{t.noGoalTasks}</p> : null}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.noGoals}</p>
              )}
            </CardContent>
          </Card>
        </DashboardPanelMotion>
      </div>
    </div>
  );
}