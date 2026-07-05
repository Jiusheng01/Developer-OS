"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CalendarDays, CheckSquare, Pencil, Save, Tags, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardEmptyState } from "@/features/dashboard/components/dashboard-empty-state";
import { DashboardListItemMotion } from "@/features/dashboard/components/dashboard-motion";
import { DashboardSection } from "@/features/dashboard/components/dashboard-section";
import type { DashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import type { TodoItem, TodoPriority } from "@/features/dashboard/types";
import { formatTags, parseTagInput } from "@/features/dashboard/utils/tags";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

const priorityOptions: TodoPriority[] = ["low", "medium", "high"];
type TodoFilter = "all" | "open" | "done" | "high";
const todoFilters: TodoFilter[] = ["all", "open", "done", "high"];

function readPriority(value: string): TodoPriority {
  return priorityOptions.find((priority) => priority === value) ?? "medium";
}

function formatDueDate(value: string | undefined, locale: "en" | "zh") {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", { month: "short", day: "numeric" });
}

export function TodoTab({ store }: { store: DashboardStore }) {
  const { locale } = useLocale();
  const t = copy[locale].dashboard.todo;
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [tags, setTags] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<TodoPriority>("medium");
  const [editTags, setEditTags] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [filter, setFilter] = useState<TodoFilter>("all");
  const visibleTodos = store.state.todos.filter((todo) => {
    if (filter === "open") return !todo.done;
    if (filter === "done") return todo.done;
    if (filter === "high") return todo.priority === "high";
    return true;
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    store.addTodo({ title, priority, tags: parseTagInput(tags), dueDate: dueDate || undefined });
    setTitle("");
    setPriority("medium");
    setTags("");
    setDueDate("");
  }

  function startEditing(todo: TodoItem) {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setEditTags(formatTags(todo.tags));
    setEditDueDate(todo.dueDate ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditPriority("medium");
    setEditTags("");
    setEditDueDate("");
  }

  function handleEditSubmit(event: FormEvent<HTMLFormElement>, todoId: string) {
    event.preventDefault();
    store.updateTodo(todoId, {
      title: editTitle,
      priority: editPriority,
      tags: parseTagInput(editTags),
      dueDate: editDueDate || undefined,
    });
    cancelEditing();
  }

  return (
    <div className="grid gap-5">
      <DashboardSection title={t.addTask} icon={CheckSquare}>
        <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem_10rem_9rem_auto]" onSubmit={handleSubmit}>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.placeholder} aria-label={t.title} />
          <select
            value={priority}
            onChange={(event) => setPriority(readPriority(event.target.value))}
            aria-label={t.priority}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            {priorityOptions.map((option) => (
              <option key={option} value={option}>{t.priorityLabels[option]}</option>
            ))}
          </select>
          <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder={t.tagsPlaceholder} aria-label={t.tags} />
          <Input value={dueDate} onChange={(event) => setDueDate(event.target.value)} type="date" aria-label={t.dueDate} />
          <Button type="submit">{t.add}</Button>
        </form>
      </DashboardSection>
      <DashboardSection title={t.tasks} description={t.tasksDescription} icon={CheckSquare} contentClassName="grid gap-3">
        <div className="flex flex-wrap gap-2">
          {todoFilters.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={filter === option ? "default" : "outline"}
              onClick={() => setFilter(option)}
            >
              {t.filterLabels[option]}
            </Button>
          ))}
        </div>
        <AnimatePresence initial={false}>
          {visibleTodos.map((todo) => {
            const isEditing = editingId === todo.id;
            const dueDateLabel = formatDueDate(todo.dueDate, locale);

            return (
              <DashboardListItemMotion key={todo.id}>
                <div className="rounded-md border bg-background/70 p-4">
                  {isEditing ? (
                    <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem_10rem_9rem_auto_auto]" onSubmit={(event) => handleEditSubmit(event, todo.id)}>
                      <Input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} aria-label={t.title} />
                      <select
                        value={editPriority}
                        onChange={(event) => setEditPriority(readPriority(event.target.value))}
                        aria-label={t.priority}
                        className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {priorityOptions.map((option) => (
                          <option key={option} value={option}>{t.priorityLabels[option]}</option>
                        ))}
                      </select>
                      <Input value={editTags} onChange={(event) => setEditTags(event.target.value)} placeholder={t.tagsPlaceholder} aria-label={t.tags} />
                      <Input value={editDueDate} onChange={(event) => setEditDueDate(event.target.value)} type="date" aria-label={t.dueDate} />
                      <Button type="submit" size="sm">
                        <Save className="h-4 w-4" />
                        {t.save}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="h-4 w-4" />
                        {t.cancel}
                      </Button>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <input
                          aria-label={`${t.toggle} ${todo.title}`}
                          type="checkbox"
                          checked={todo.done}
                          onChange={() => store.toggleTodo(todo.id)}
                          className="mt-1 h-5 w-5 shrink-0 accent-primary"
                        />
                        <div className="min-w-0">
                          <p className={cn("text-sm font-medium", todo.done && "text-muted-foreground line-through")}>{todo.title}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant={todo.priority === "high" ? "default" : "secondary"}>{t.priorityLabels[todo.priority]}</Badge>
                            {dueDateLabel ? (
                              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {t.due}: {dueDateLabel}
                              </span>
                            ) : null}
                            {todo.tags.map((tag) => (
                              <span key={tag} className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                                <Tags className="h-3.5 w-3.5" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1 self-end lg:self-start">
                        <Button type="button" variant="ghost" size="icon" onClick={() => startEditing(todo)} aria-label={`${t.edit} ${todo.title}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => store.deleteTodo(todo.id)} aria-label={`${t.delete} ${todo.title}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DashboardListItemMotion>
            );
          })}
        </AnimatePresence>
        {store.state.todos.length === 0 ? <DashboardEmptyState title={t.emptyTitle} description={t.emptyDescription} icon={CheckSquare} /> : null}
        {store.state.todos.length > 0 && visibleTodos.length === 0 ? <DashboardEmptyState title={t.noMatches} icon={CheckSquare} /> : null}
      </DashboardSection>
    </div>
  );
}
