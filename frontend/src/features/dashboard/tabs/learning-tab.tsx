"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { learningTracks } from "@/data/learning";
import { DashboardListItemMotion } from "@/features/dashboard/components/dashboard-motion";
import type { DashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import type { LearningStatus } from "@/features/dashboard/types";
import { formatTags, parseTagInput } from "@/features/dashboard/utils/tags";
import { copy } from "@/lib/i18n/copy";
import { pickLocale, useLocale } from "@/lib/i18n/locale-provider";

const statusOptions: LearningStatus[] = ["queued", "active", "review", "done"];

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
      <Card>
        <CardHeader>
          <CardTitle>{t.privatePlan}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.items}</CardTitle>
          <CardDescription>{t.itemsDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <AnimatePresence initial={false}>
            {store.state.learningItems.map((item) => (
              <DashboardListItemMotion key={item.id} className="grid gap-4 rounded-md border bg-background p-4">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_9rem_7rem]">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.publicContext}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          {learningTracks.map((track) => (
            <div key={track.id} className="rounded-md border bg-background p-3">
              <p className="font-medium">{pickLocale(track.title, locale)}</p>
              <p className="mt-2 text-sm text-muted-foreground">{pickLocale(track.milestone, locale)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}