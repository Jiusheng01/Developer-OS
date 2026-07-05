"use client";

import { FormEvent, useState } from "react";
import { BrainCircuit, CalendarDays, Clock, ListChecks, NotebookText, Route, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { generateLearningPlan } from "@/features/ai/data/ai-api";
import type { LearningPlanDraft } from "@/features/ai/data/types";
import { DashboardEmptyState } from "@/features/dashboard/components/dashboard-empty-state";
import { DashboardPanelMotion } from "@/features/dashboard/components/dashboard-motion";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { DashboardStatusStrip } from "@/features/dashboard/components/dashboard-status-strip";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";

function parseStack(value: string) {
  const seen = new Set<string>();
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Planner request failed";
}

export function PlannerTab() {
  const { locale } = useLocale();
  const t = copy[locale].dashboard.planner;
  const [target, setTarget] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [deadline, setDeadline] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(6);
  const [preferredStack, setPreferredStack] = useState("");
  const [constraints, setConstraints] = useState("");
  const [draft, setDraft] = useState<LearningPlanDraft | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target.trim() || !currentLevel.trim()) {
      setError(t.required);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const nextDraft = await generateLearningPlan({
        target: target.trim(),
        currentLevel: currentLevel.trim(),
        deadline: deadline || undefined,
        weeklyHours,
        preferredStack: parseStack(preferredStack),
        constraints,
      });
      setDraft(nextDraft);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5">
      <DashboardPanelMotion>
        <DashboardSection title={t.title} description={t.description} icon={BrainCircuit}>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Input value={target} onChange={(event) => setTarget(event.target.value)} placeholder={t.targetPlaceholder} aria-label={t.target} />
              <Input value={currentLevel} onChange={(event) => setCurrentLevel(event.target.value)} placeholder={t.currentLevelPlaceholder} aria-label={t.currentLevel} />
            </div>
            <div className="grid gap-3 lg:grid-cols-[10rem_10rem_minmax(0,1fr)]">
              <Input value={deadline} onChange={(event) => setDeadline(event.target.value)} type="date" aria-label={t.deadline} />
              <Input value={weeklyHours} onChange={(event) => setWeeklyHours(Number(event.target.value) || 1)} type="number" min={1} max={80} aria-label={t.weeklyHours} />
              <Input value={preferredStack} onChange={(event) => setPreferredStack(event.target.value)} placeholder={t.stackPlaceholder} aria-label={t.preferredStack} />
            </div>
            <Textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder={t.constraintsPlaceholder} aria-label={t.constraints} />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={loading}>
                <BrainCircuit className="h-4 w-4" />
                {loading ? t.generating : t.generate}
              </Button>
              <p className="text-xs text-muted-foreground">{t.boundaryHint}</p>
            </div>
          </form>
        </DashboardSection>
      </DashboardPanelMotion>

      {error ? <DashboardStatusStrip title={t.errorTitle} detail={error} variant="warning" /> : null}

      <DashboardSection title={t.draftTitle} description={t.draftDescription} icon={Route} contentClassName="grid gap-4">
        {!draft ? <DashboardEmptyState title={t.emptyDraft} description={t.emptyDraftDescription} icon={BrainCircuit} /> : null}
        {draft ? (
          <div className="grid gap-4">
            <div className="rounded-md border bg-background/70 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{draft.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{draft.summary}</p>
                </div>
                <Badge>{draft.status}</Badge>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <PlanBlock title={t.goals} icon={Target} items={draft.goals.map((goal) => goal.targetYear ? `${goal.title} (${goal.targetYear})` : goal.title)} />
              <PlanBlock title={t.todos} icon={ListChecks} items={draft.todos.map((todo) => `${todo.title} · ${todo.priority}`)} />
              <PlanBlock title={t.learningItems} icon={Clock} items={draft.learningItems.map((item) => `${item.title} · ${item.area}`)} />
              <PlanBlock title={t.notePrompts} icon={NotebookText} items={draft.notePrompts.map((prompt) => `${prompt.title} · ${prompt.category}`)} />
            </div>
            {deadline ? (
              <div className="inline-flex w-fit items-center gap-2 rounded-md border px-3 py-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" />
                {t.deadline}: {deadline}
              </div>
            ) : null}
          </div>
        ) : null}
      </DashboardSection>
    </div>
  );
}

function PlanBlock({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Target;
  items: string[];
}) {
  return (
    <div className="rounded-md border bg-background/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <div className="grid gap-2">
        {items.map((item) => (
          <p key={item} className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
