"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { NotebookText, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DashboardEmptyState } from "@/features/dashboard/components/dashboard-empty-state";
import { DashboardListItemMotion } from "@/features/dashboard/components/dashboard-motion";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
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
      <DashboardSection title={t.addNote} description={t.description} icon={NotebookText}>
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]" onSubmit={handleSubmit}>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.placeholder} aria-label={t.title} />
          <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder={t.categoryPlaceholder} aria-label={t.category} />
          <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tagsPlaceholder} aria-label={t.tags} />
          <Button type="submit">{t.add}</Button>
        </form>
      </DashboardSection>

      <DashboardSection title={t.library} description={t.libraryDescription} icon={NotebookText} contentClassName="grid gap-4 lg:grid-cols-2">
        <AnimatePresence initial={false}>
          {store.state.notes.map((note) => (
            <DashboardListItemMotion key={note.id}>
              <div className="rounded-md border bg-background/70 p-4">
                <div className="grid gap-3">
                  <div className="flex items-start gap-2">
                    <Input value={note.title} onChange={(event) => store.updateNote(note.id, { title: event.target.value })} aria-label={t.title} className="min-w-0 flex-1" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => store.deleteNote(note.id)} aria-label={`${t.delete} ${note.title}`} className="shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
                </div>
                <div className="mt-4">
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
                </div>
              </div>
            </DashboardListItemMotion>
          ))}
        </AnimatePresence>
        {store.state.notes.length === 0 ? <DashboardEmptyState title={t.emptyTitle} description={t.emptyDescription} icon={NotebookText} className="lg:col-span-2" /> : null}
      </DashboardSection>
    </div>
  );
}
