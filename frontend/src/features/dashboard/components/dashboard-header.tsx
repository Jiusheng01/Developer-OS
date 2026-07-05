"use client";

import Link from "next/link";
import { Activity, ExternalLink, LogOut, Moon, Sun } from "lucide-react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Button } from "@/components/ui/button";
import { DashboardProviderBadge } from "@/features/dashboard/components/dashboard-provider-badge";
import type { DashboardDataProviderMode } from "@/features/dashboard/data/provider-config";
import type { DashboardTab } from "@/features/dashboard/types";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { ThemePreference } from "@/lib/theme/theme-provider";
import { cn } from "@/lib/utils";

export function DashboardHeader({
  activeTab,
  providerMode,
  dataError,
  theme,
  onThemeChange,
  onSignOut,
}: {
  activeTab: DashboardTab;
  providerMode: DashboardDataProviderMode;
  dataError?: string;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onSignOut?: () => void;
}) {
  const { locale } = useLocale();
  const t = copy[locale].dashboard;
  const nextTheme = theme === "dark" ? "light" : "dark";
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <header className="flex flex-col gap-4 border-b bg-background/90 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:px-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.workspace}</p>
        <h1 className="mt-1 truncate text-2xl font-semibold tracking-normal">{t.tabs[activeTab]}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <DashboardProviderBadge mode={providerMode} labels={t.providerLabels} />
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium",
              dataError ? "border-accent/40 bg-accent/10 text-accent" : "border-primary/25 bg-primary/10 text-primary",
            )}
          >
            <Activity className="h-3.5 w-3.5" />
            {dataError ? t.dataIssue : t.dataReady}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Button asChild variant="outline" size="sm" aria-label={t.publicSite}>
          <Link href="/">
            <span className="hidden sm:inline">{t.publicSite}</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
        <LanguageToggle compact />
        <Button type="button" variant="outline" size="sm" onClick={() => onThemeChange(nextTheme)} aria-label={nextTheme === "dark" ? t.dark : t.light}>
          <ThemeIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{nextTheme === "dark" ? t.dark : t.light}</span>
        </Button>
        {onSignOut ? (
          <Button type="button" variant="ghost" size="sm" onClick={onSignOut} aria-label={t.auth.signOut}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t.auth.signOut}</span>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
