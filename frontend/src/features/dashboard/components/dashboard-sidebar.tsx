"use client";

import type { ComponentType } from "react";
import { BookOpenCheck, Boxes, BrainCircuit, CheckSquare, ClipboardList, Home, NotebookText, Settings, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardProviderBadge } from "@/features/dashboard/components/dashboard-provider-badge";
import type { DashboardDataProviderMode } from "@/features/dashboard/data/provider-config";
import type { DashboardTab } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";

const tabs: Array<{ id: DashboardTab; icon: ComponentType<{ className?: string }> }> = [
  { id: "today", icon: Home },
  { id: "planner", icon: BrainCircuit },
  { id: "todo", icon: CheckSquare },
  { id: "learning", icon: BookOpenCheck },
  { id: "notes", icon: NotebookText },
  { id: "goals", icon: Target },
  { id: "models", icon: Boxes },
  { id: "settings", icon: Settings },
];

export function DashboardSidebar({
  activeTab,
  providerMode,
  onSelect,
}: {
  activeTab: DashboardTab;
  providerMode: DashboardDataProviderMode;
  onSelect: (tab: DashboardTab) => void;
}) {
  const { locale } = useLocale();
  const t = copy[locale].dashboard;

  return (
    <aside className="border-b bg-card/95 px-3 py-3 backdrop-blur lg:sticky lg:top-0 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:px-3 lg:py-4">
      <div className="mb-3 flex items-center justify-between gap-3 px-1 lg:mb-6 lg:block lg:px-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-background">
          <ClipboardList className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">Developer OS</p>
            <p className="truncate text-xs text-muted-foreground">{t.privateWorkspace}</p>
          </div>
        </div>
        <DashboardProviderBadge mode={providerMode} labels={t.providerLabels} className="lg:mt-4" />
      </div>
      <nav className="-mx-1 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:grid lg:overflow-visible lg:pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === activeTab;
          return (
            <Button
              key={tab.id}
              type="button"
              variant="ghost"
              className={cn(
                "relative h-10 shrink-0 justify-start px-3 text-muted-foreground lg:w-full",
                selected && "bg-secondary text-foreground",
                selected &&
                  "after:absolute after:bottom-1 after:left-3 after:right-3 after:h-px after:bg-primary lg:after:bottom-2 lg:after:left-1 lg:after:right-auto lg:after:top-2 lg:after:h-auto lg:after:w-0.5",
              )}
              onClick={() => onSelect(tab.id)}
            >
              <Icon className="h-4 w-4" />
              <span>{t.tabs[tab.id]}</span>
            </Button>
          );
        })}
      </nav>
    </aside>
  );
}
