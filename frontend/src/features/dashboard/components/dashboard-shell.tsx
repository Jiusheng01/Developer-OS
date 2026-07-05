"use client";

import { AuthGate } from "@/features/auth/components/auth-gate";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { DashboardSidebar } from "@/features/dashboard/components/dashboard-sidebar";
import { DashboardTabTransition } from "@/features/dashboard/components/dashboard-motion";
import { DashboardStatusStrip } from "@/features/dashboard/components/dashboard-status-strip";
import { GoalsTab } from "@/features/dashboard/tabs/goals-tab";
import { LearningTab } from "@/features/dashboard/tabs/learning-tab";
import { NotesTab } from "@/features/dashboard/tabs/notes-tab";
import { SettingsTab } from "@/features/dashboard/tabs/settings-tab";
import { TodayTab } from "@/features/dashboard/tabs/today-tab";
import { TodoTab } from "@/features/dashboard/tabs/todo-tab";
import { getDashboardDataProviderMode } from "@/features/dashboard/data/provider-config";
import { useDashboardStore } from "@/features/dashboard/hooks/use-dashboard-store";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";

export function DashboardShell() {
  const providerMode = getDashboardDataProviderMode();

  if (providerMode === "api") {
    return (
      <AuthGate>
        <AuthenticatedDashboardShell />
      </AuthGate>
    );
  }

  return <DashboardWorkspace />;
}

function AuthenticatedDashboardShell() {
  const auth = useAuth();
  return <DashboardWorkspace onSignOut={auth.logout} />;
}

function DashboardWorkspace({ onSignOut }: { onSignOut?: () => void }) {
  const store = useDashboardStore();
  const { locale } = useLocale();
  const t = copy[locale].dashboard;

  if (!store.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-muted-foreground">
        <div className="grid gap-3 text-center">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-md border bg-card" />
          <p className="text-sm">{t.loading}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[16rem_1fr]">
      <DashboardSidebar activeTab={store.activeTab} providerMode={store.providerMode} onSelect={store.setActiveTab} />
      <div className="min-w-0">
        <DashboardHeader
          activeTab={store.activeTab}
          providerMode={store.providerMode}
          dataError={store.dataError}
          theme={store.state.preferences.theme}
          onThemeChange={store.setTheme}
          onSignOut={onSignOut}
        />
        <main className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-5 lg:px-6">
          {store.dataError ? (
            <DashboardStatusStrip title={t.dataIssue} detail={`${t.dataIssueDetail} ${store.dataError}`} variant="warning" />
          ) : null}
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
