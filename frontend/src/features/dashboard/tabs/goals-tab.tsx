"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Target, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { DashboardEmptyState } from "@/features/dashboard/components/dashboard-empty-state";
import { DashboardListItemMotion } from "@/features/dashboard/components/dashboard-motion";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import type { DashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import type { GoalStatus } from "@/features/dashboard/types";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";

const statusOptions: GoalStatus[] = ["planned", "active", "done"];

function readStatus(value: string): GoalStatus {
  return statusOptions.find((status) => status === value) ?? "planned";
}

function readProgress(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function GoalTaskForm({ goalId, store, label, placeholder }: { goalId: string; store: DashboardStore; label: string; placeholder: string }) {
  const [title, setTitle] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    store.addGoalTask(goalId, title);
    setTitle("");
  }

  return (
    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
      <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={placeholder} aria-label={label} />
      <Button type="submit" size="sm">{label}</Button>
    </form>
  );
}

export function GoalsTab({ store }: { store: DashboardStore }) {
  const { locale } = useLocale();
  const t = copy[locale].dashboard.goals;
  const [title, setTitle] = useState("");
  const [targetYear, setTargetYear] = useState("");
  const [status, setStatus] = useState<GoalStatus>("planned");
  const [progress, setProgress] = useState("0");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    store.addGoal({ title, targetYear, status, progress: readProgress(progress) });
    setTitle("");
    setTargetYear("");
    setStatus("planned");
    setProgress("0");
  }

  return (
    <div className="grid gap-5">
      <DashboardSection title={t.addGoal} icon={Target}>
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_8rem_9rem_7rem_auto]" onSubmit={handleSubmit}>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.placeholder} aria-label={t.title} />
          <Input value={targetYear} onChange={(event) => setTargetYear(event.target.value)} placeholder={t.targetYear} aria-label={t.targetYear} />
          <select
            value={status}
            onChange={(event) => setStatus(readStatus(event.target.value))}
            aria-label={t.status}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>{t.statusLabels[option]}</option>
            ))}
          </select>
          <Input value={progress} onChange={(event) => setProgress(event.target.value)} min={0} max={100} type="number" aria-label={t.progress} />
          <Button type="submit">{t.add}</Button>
        </form>
      </DashboardSection>

      <DashboardSection title={t.activeGoals} description={t.activeGoalsDescription} icon={Target} contentClassName="grid gap-4 lg:grid-cols-2">
        <AnimatePresence initial={false}>
          {store.state.goals.map((goal) => {
            const completedTasks = goal.tasks.filter((task) => task.done).length;
            return (
              <DashboardListItemMotion key={goal.id}>
                <div className="rounded-md border bg-background/70 p-4">
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-base font-semibold">{goal.title}</p>
                      <Badge variant={goal.status === "active" ? "default" : "secondary"}>{t.statusLabels[goal.status]}</Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
                      <Input value={goal.title} onChange={(event) => store.updateGoal(goal.id, { title: event.target.value })} aria-label={t.title} />
                      <Input value={goal.targetYear ?? ""} onChange={(event) => store.updateGoal(goal.id, { targetYear: event.target.value })} placeholder={t.targetYear} aria-label={t.targetYear} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-[9rem_7rem]">
                      <select
                        value={goal.status}
                        onChange={(event) => store.updateGoal(goal.id, { status: readStatus(event.target.value) })}
                        aria-label={t.status}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>{t.statusLabels[option]}</option>
                        ))}
                      </select>
                      <Input
                        value={goal.progress}
                        onChange={(event) => store.updateGoal(goal.id, { progress: readProgress(event.target.value) })}
                        min={0}
                        max={100}
                        type="number"
                        aria-label={t.progress}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={goal.progress} className="flex-1" />
                      <span className="w-12 text-right text-sm font-medium">{goal.progress}%</span>
                    </div>
                    <div className="rounded-md border bg-background/80 p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{t.tasks}</p>
                        <span className="text-xs text-muted-foreground">{completedTasks}/{goal.tasks.length}</span>
                      </div>
                      <GoalTaskForm goalId={goal.id} store={store} label={t.addTask} placeholder={t.taskPlaceholder} />
                      <div className="mt-3 grid gap-2">
                        <AnimatePresence initial={false}>
                          {goal.tasks.map((task) => (
                            <DashboardListItemMotion key={task.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
                              <input
                                aria-label={`${t.toggleTask} ${task.title}`}
                                type="checkbox"
                                checked={task.done}
                                onChange={() => store.toggleGoalTask(goal.id, task.id)}
                                className="h-4 w-4 accent-primary"
                              />
                              <span className={task.done ? "flex-1 text-sm text-muted-foreground line-through" : "flex-1 text-sm"}>{task.title}</span>
                              <Button type="button" variant="ghost" size="icon" onClick={() => store.deleteGoalTask(goal.id, task.id)} aria-label={`${t.deleteTask} ${task.title}`}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DashboardListItemMotion>
                          ))}
                        </AnimatePresence>
                        {goal.tasks.length === 0 ? <DashboardEmptyState title={t.noTasks} icon={Target} /> : null}
                      </div>
                    </div>
                  </div>
                </div>
              </DashboardListItemMotion>
            );
          })}
        </AnimatePresence>
        {store.state.goals.length === 0 ? <DashboardEmptyState title={t.emptyTitle} description={t.emptyDescription} icon={Target} className="lg:col-span-2" /> : null}
      </DashboardSection>
    </div>
  );
}
