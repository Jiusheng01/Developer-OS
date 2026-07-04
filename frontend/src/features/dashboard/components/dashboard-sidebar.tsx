"use client";

import type { ComponentType } from "react";
import { BookOpenCheck, CheckSquare, ClipboardList, Home, NotebookText, Settings, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { DashboardTab } from "@/features/dashboard/types";

const tabs: Array<{ id: DashboardTab; icon: ComponentType<{ className?: string }> }> = [
  { id: "today", icon: Home },
  { id: "todo", icon: CheckSquare },
  { id: "learning", icon: BookOpenCheck },
  { id: "notes", icon: NotebookText },
  { id: "goals", icon: Target },
  { id: "settings", icon: Settings },
];

export function DashboardSidebar({ activeTab, onSelect }: { activeTab: DashboardTab; onSelect: (tab: DashboardTab) => void }) {
  const { locale } = useLocale();
  const t = copy[locale].dashboard;

  return (
    <aside className="border-r bg-card px-3 py-4 lg:min-h-screen lg:w-64">
      <div className="mb-5 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold">Developer OS</p>
          <p className="text-xs text-muted-foreground">{t.privateWorkspace}</p>
        </div>
      </div>
      <nav className="grid gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === activeTab;
          return (
            <Button
              key={tab.id}
              type="button"
              variant="ghost"
              className={cn("justify-start", selected && "bg-secondary text-foreground")}
              onClick={() => onSelect(tab.id)}
            >
              <Icon className="h-4 w-4" />
              {t.tabs[tab.id]}
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}