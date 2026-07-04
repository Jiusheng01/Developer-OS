"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DashboardListItemMotion } from "@/features/dashboard/components/dashboard-motion";
import type { DashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import { formatTags, parseTagInput } from "@/features/dashboard/utils/tags";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";

export function NotesTab({ store }: { store: DashboardStore }) {
  const { locale } = useLocale();
  const t = copy[locale].dashboard.notes;
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    store.addNote({ title, category, tags: parseTagInput(tags), body: "" });
    setTitle("");
    setCategory("");
    setTags("");
  }

  return (
    <div className="grid gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{t.addNote}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]" onSubmit={handleSubmit}>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.placeholder} aria-label={t.title} />
            <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder={t.categoryPlaceholder} aria-label={t.category} />
            <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tagsPlaceholder} aria-label={t.tags} />
            <Button type="submit">{t.add}</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <AnimatePresence initial={false}>
          {store.state.notes.map((note) => (
            <DashboardListItemMotion key={note.id}>
              <Card>
                <CardHeader className="grid gap-3">
                  <Input value={note.title} onChange={(event) => store.updateNote(note.id, { title: event.target.value })} aria-label={t.title} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input value={note.category} onChange={(event) => store.updateNote(note.id, { category: event.target.value })} aria-label={t.category} />
                    <Input
                      value={formatTags(note.tags)}
                      onChange={(event) => store.updateNote(note.id, { tags: parseTagInput(event.target.value) })}
                      placeholder={t.tagsPlaceholder}
                      aria-label={t.tags}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{note.category}</Badge>
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={note.body}
                    onChange={(event) => store.updateNote(note.id, { body: event.target.value })}
                    placeholder={t.bodyPlaceholder}
                    aria-label={t.body}
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{t.markdownHint}</span>
                    <span>{t.updated} {new Date(note.updatedAt).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}</span>
                  </div>
                </CardContent>
              </Card>
            </DashboardListItemMotion>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}