"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { NotebookText, Search, Trash2 } from "lucide-react";
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
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const categories = Array.from(new Set(store.state.notes.map((note) => note.category).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
  const normalizedQuery = query.trim().toLowerCase();
  const visibleNotes = store.state.notes.filter((note) => {
    const matchesCategory = categoryFilter === "all" || note.category === categoryFilter;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    const searchable = [note.title, note.body, note.category, ...note.tags].join(" ").toLowerCase();
    return searchable.includes(normalizedQuery);
  });

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
        <div className="grid gap-3 lg:col-span-2 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.search}
              className="pl-9"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label={t.categoryFilter}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">{t.allCategories}</option>
            {categories.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <AnimatePresence initial={false}>
          {visibleNotes.map((note) => (
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
        {store.state.notes.length > 0 && visibleNotes.length === 0 ? <DashboardEmptyState title={t.noMatches} icon={NotebookText} className="lg:col-span-2" /> : null}
      </DashboardSection>
    </div>
  );
}
