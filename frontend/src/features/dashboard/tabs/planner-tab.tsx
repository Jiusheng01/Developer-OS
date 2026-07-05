"use client";

import { FormEvent, useEffect, useState } from "react";
import { BrainCircuit, CalendarDays, Clock, History, KeyRound, ListChecks, NotebookText, RefreshCcw, Route, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { commitLearningPlanDraft, generateLearningPlan, listAIProviders, listLearningPlanDrafts } from "@/features/ai/data/ai-api";
import type { AIProviderConfig, LearningPlanDraft } from "@/features/ai/data/types";
import { DashboardEmptyState } from "@/features/dashboard/components/dashboard-empty-state";
import { DashboardPanelMotion } from "@/features/dashboard/components/dashboard-motion";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import { DashboardStatusStrip } from "@/features/dashboard/components/dashboard-status-strip";
import type { DashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import { getApiErrorMessage } from "@/lib/api/error-message";
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

export function PlannerTab({ store }: { store: DashboardStore }) {
  const { locale } = useLocale();
  const t = copy[locale].dashboard.planner;
  const [target, setTarget] = useState("");
  const [currentLevel, setCurrentLevel] = useState("");
  const [deadline, setDeadline] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(6);
  const [preferredStack, setPreferredStack] = useState("");
  const [constraints, setConstraints] = useState("");
  const [draft, setDraft] = useState<LearningPlanDraft | undefined>();
  const [draftHistory, setDraftHistory] = useState<LearningPlanDraft[]>([]);
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providerIssue, setProviderIssue] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const readyProvider = providers.find((provider) => provider.isDefault && provider.enabled && provider.hasApiKey);
  const canGenerate = Boolean(readyProvider) && !providersLoading && !loading;

  useEffect(() => {
    let cancelled = false;
    void listLearningPlanDrafts()
      .then((drafts) => {
        if (!cancelled) setDraftHistory(drafts);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(requestError, "Planner request failed"));
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void listAIProviders()
      .then((loadedProviders) => {
        if (cancelled) return;
        setProviders(loadedProviders);
        setProviderIssue("");
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setProviderIssue(getApiErrorMessage(requestError, "AI provider request failed"));
      })
      .finally(() => {
        if (!cancelled) setProvidersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function reloadDraftHistory() {
    setHistoryLoading(true);
    try {
      setDraftHistory(await listLearningPlanDrafts());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Planner request failed"));
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target.trim() || !currentLevel.trim()) {
      setError(t.required);
      return;
    }
    if (!readyProvider) {
      setError(t.setupRequiredDetail);
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
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
      setDraftHistory((current) => [nextDraft, ...current.filter((item) => item.id !== nextDraft.id)]);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Planner request failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleCommitDraft() {
    if (!draft) return;
    setImporting(true);
    setError("");
    setMessage("");
    try {
      const result = await commitLearningPlanDraft(draft.id);
      await store.reloadData();
      setDraft((current) => (current ? { ...current, status: result.status } : current));
      setDraftHistory((current) =>
        current.map((historyDraft) => (historyDraft.id === result.draftId ? { ...historyDraft, status: result.status } : historyDraft)),
      );
      setMessage(
        t.importSuccess
          .replace("{goals}", String(result.goalsCreated))
          .replace("{learning}", String(result.learningItemsCreated))
          .replace("{todos}", String(result.todosCreated))
          .replace("{notes}", String(result.notesCreated)),
      );
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Planner request failed"));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="grid gap-5">
      <DashboardPanelMotion>
        <DashboardSection title={t.title} description={t.description} icon={BrainCircuit}>
          {providersLoading ? <DashboardStatusStrip title={t.checkingProvider} variant="info" /> : null}
          {!providersLoading && !readyProvider ? (
            <DashboardStatusStrip
              title={t.setupRequired}
              detail={providerIssue || t.setupRequiredDetail}
              variant="warning"
              actionLabel={t.openModels}
              onAction={() => store.setActiveTab("models")}
            />
          ) : null}
          {readyProvider ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              {t.activeProvider}: {readyProvider.displayName} / {readyProvider.model}
            </div>
          ) : null}
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
              <Button type="submit" disabled={!canGenerate}>
                <BrainCircuit className="h-4 w-4" />
                {loading ? t.generating : t.generate}
              </Button>
              {!readyProvider && !providersLoading ? (
                <Button type="button" variant="outline" onClick={() => store.setActiveTab("models")}>
                  <KeyRound className="h-4 w-4" />
                  {t.openModels}
                </Button>
              ) : null}
              <p className="text-xs text-muted-foreground">{t.boundaryHint}</p>
            </div>
          </form>
        </DashboardSection>
      </DashboardPanelMotion>

      {error ? <DashboardStatusStrip title={t.errorTitle} detail={error} variant="warning" /> : null}
      {message ? <DashboardStatusStrip title={message} variant="info" /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <DashboardSection title={t.historyTitle} description={t.historyDescription} icon={History} contentClassName="grid gap-3">
          <div className="flex justify-end">
            <Button type="button" size="sm" variant="outline" onClick={() => void reloadDraftHistory()} disabled={historyLoading}>
              <RefreshCcw className="h-4 w-4" />
              {historyLoading ? t.loadingHistory : t.refreshHistory}
            </Button>
          </div>
          {!historyLoading && draftHistory.length === 0 ? (
            <DashboardEmptyState title={t.emptyHistory} description={t.emptyHistoryDescription} icon={History} />
          ) : null}
          {draftHistory.map((historyDraft) => (
            <button
              key={historyDraft.id}
              type="button"
              onClick={() => setDraft(historyDraft)}
              className="rounded-md border bg-background/70 p-4 text-left transition-colors hover:bg-secondary"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{historyDraft.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{historyDraft.summary}</p>
                </div>
                <Badge>{historyDraft.status}</Badge>
              </div>
            </button>
          ))}
        </DashboardSection>

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
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void handleCommitDraft()} disabled={importing || draft.status === "committed"}>
                    <ListChecks className="h-4 w-4" />
                    {importing ? t.importing : t.importToWorkspace}
                  </Button>
                  <p className="self-center text-xs text-muted-foreground">{t.importHint}</p>
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
