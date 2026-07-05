"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { BookOpenCheck, Route, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { learningTracks } from "@/data/learning";
import { DashboardEmptyState } from "@/features/dashboard/components/dashboard-empty-state";
import { DashboardListItemMotion } from "@/features/dashboard/components/dashboard-motion";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import type { DashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import type { LearningStatus } from "@/features/dashboard/types";
import { formatTags, parseTagInput } from "@/features/dashboard/utils/tags";
import { copy } from "@/lib/i18n/copy";
import { pickLocale, useLocale } from "@/lib/i18n/locale-provider";

const statusOptions: LearningStatus[] = ["queued", "active", "review", "done"];
type LearningFilter = "all" | LearningStatus;
const learningFilters: LearningFilter[] = ["all", ...statusOptions];

function readStatus(value: string): LearningStatus {
  return statusOptions.find((status) => status === value) ?? "queued";
}

function readProgress(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function LearningTab({ store }: { store: DashboardStore }) {
  const { locale } = useLocale();
  const t = copy[locale].dashboard.learning;
  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [status, setStatus] = useState<LearningStatus>("queued");
  const [progress, setProgress] = useState("0");
  const [tags, setTags] = useState("");
  const [filter, setFilter] = useState<LearningFilter>("all");
  const visibleItems = store.state.learningItems.filter((item) => (filter === "all" ? true : item.status === filter));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    store.addLearningItem({
      title,
      area,
      status,
      progress: readProgress(progress),
      tags: parseTagInput(tags),
      notes: "",
    });
    setTitle("");
    setArea("");
    setStatus("queued");
    setProgress("0");
    setTags("");
  }

  return (
    <div className="grid gap-5">
      <DashboardSection title={t.privatePlan} description={t.description} icon={BookOpenCheck}>
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_9rem_7rem_12rem_auto]" onSubmit={handleSubmit}>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.titlePlaceholder} aria-label={t.title} />
          <Input value={area} onChange={(event) => setArea(event.target.value)} placeholder={t.areaPlaceholder} aria-label={t.area} />
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
          <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tagsPlaceholder} aria-label={t.tags} />
          <Button type="submit">{t.add}</Button>
        </form>
      </DashboardSection>

      <DashboardSection title={t.items} description={t.itemsDescription} icon={Route} contentClassName="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {learningFilters.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={filter === option ? "default" : "outline"}
              onClick={() => setFilter(option)}
            >
              {option === "all" ? t.all : t.statusLabels[option]}
            </Button>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {visibleItems.map((item) => (
            <DashboardListItemMotion key={item.id} className="grid gap-4 rounded-md border bg-background/70 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="grid min-w-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_9rem_7rem]">
                  <Input value={item.title} onChange={(event) => store.updateLearningItem(item.id, { title: event.target.value })} aria-label={t.title} />
                  <Input value={item.area} onChange={(event) => store.updateLearningItem(item.id, { area: event.target.value })} aria-label={t.area} />
                  <select
                    value={item.status}
                    onChange={(event) => store.updateLearningItem(item.id, { status: readStatus(event.target.value) })}
                    aria-label={t.status}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>{t.statusLabels[option]}</option>
                    ))}
                  </select>
                  <Input
                    value={item.progress}
                    onChange={(event) => store.updateLearningItem(item.id, { progress: readProgress(event.target.value) })}
                    min={0}
                    max={100}
                    type="number"
                    aria-label={t.progress}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => store.deleteLearningItem(item.id)} aria-label={`${t.delete} ${item.title}`} className="self-end lg:self-start">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={item.progress} className="flex-1" />
                <span className="w-12 text-right text-sm font-medium">{item.progress}%</span>
                <Badge variant={item.status === "active" ? "default" : "secondary"}>{t.statusLabels[item.status]}</Badge>
              </div>
              <Input
                value={formatTags(item.tags)}
                onChange={(event) => store.updateLearningItem(item.id, { tags: parseTagInput(event.target.value) })}
                placeholder={t.tagsPlaceholder}
                aria-label={t.tags}
              />
              <Textarea
                value={item.notes}
                onChange={(event) => store.updateLearningItem(item.id, { notes: event.target.value })}
                placeholder={t.notesPlaceholder}
                aria-label={t.notes}
              />
            </DashboardListItemMotion>
          ))}
        </AnimatePresence>
        {store.state.learningItems.length === 0 ? <DashboardEmptyState title={t.emptyTitle} description={t.emptyDescription} icon={BookOpenCheck} /> : null}
        {store.state.learningItems.length > 0 && visibleItems.length === 0 ? <DashboardEmptyState title={t.noMatches} icon={BookOpenCheck} /> : null}
      </DashboardSection>

      <DashboardSection title={t.publicContext} icon={BookOpenCheck} contentClassName="grid gap-3 lg:grid-cols-3">
        {learningTracks.map((track) => (
          <div key={track.id} className="rounded-md border bg-background/70 p-3">
            <p className="font-medium">{pickLocale(track.title, locale)}</p>
            <p className="mt-2 text-sm text-muted-foreground">{pickLocale(track.milestone, locale)}</p>
          </div>
        ))}
      </DashboardSection>
    </div>
  );
}
