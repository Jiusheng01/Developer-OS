"use client";

import { AccessGate } from "@/features/dashboard/components/access-gate";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import { DashboardTabTransition } from "@/features/dashboard/components/dashboard-motion";
import { GoalsTab } from "@/features/dashboard/tabs/goals-tab";
import { LearningTab } from "@/features/dashboard/tabs/learning-tab";
import { NotesTab } from "@/features/dashboard/tabs/notes-tab";
import { SettingsTab } from "@/features/dashboard/tabs/settings-tab";
import { TodayTab } from "@/features/dashboard/tabs/today-tab";
import { TodoTab } from "@/features/dashboard/tabs/todo-tab";
import { useDashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";

export function DashboardShell() {
  const store = useDashboardStore();
  const { locale } = useLocale();

  if (!store.hydrated) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">{copy[locale].dashboard.workspace}...</div>;
  }

  if (!store.hasPasscode || !store.state.access.unlocked) {
    return <AccessGate hasPasscode={store.hasPasscode} onCreatePasscode={store.createPasscode} onUnlock={store.unlock} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[16rem_1fr]">
      <DashboardSidebar activeTab={store.activeTab} onSelect={store.setActiveTab} />
      <div className="min-w-0">
        <DashboardHeader
          activeTab={store.activeTab}
          theme={store.state.preferences.theme}
          onThemeChange={store.setTheme}
          onLock={store.lock}
        />
        <main className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-6">
          <DashboardTabTransition activeKey={store.activeTab}>
            {store.activeTab === "today" ? <TodayTab store={store} /> : null}
            {store.activeTab === "todo" ? <TodoTab store={store} /> : null}
            {store.activeTab === "learning" ? <LearningTab store={store} /> : null}
            {store.activeTab === "notes" ? <NotesTab store={store} /> : null}
            {store.activeTab === "goals" ? <GoalsTab store={store} /> : null}
            {store.activeTab === "settings" ? <SettingsTab store={store} /> : null}
          </DashboardTabTransition>
        </main>
      </div>
    </div>
  );
}