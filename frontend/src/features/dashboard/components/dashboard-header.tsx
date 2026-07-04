"use client";

import Link from "next/link";
import { ExternalLink, LogOut, Moon, Sun } from "lucide-react";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/locale-provider";
import type { DashboardTab } from "@/features/dashboard/types";
import type { ThemePreference } from "@/lib/theme/theme-provider";

export function DashboardHeader({
  activeTab,
  theme,
  onThemeChange,
  onLock,
}: {
  activeTab: DashboardTab;
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onLock: () => void;
}) {
  const { locale } = useLocale();
  const t = copy[locale].dashboard;
  const nextTheme = theme === "dark" ? "light" : "dark";
  const ThemeIcon = theme === "dark" ? Sun : Moon;

  return (
    <header className="flex flex-col gap-3 border-b bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.workspace}</p>
        <h1 className="text-2xl font-semibold tracking-normal">{t.tabs[activeTab]}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            {t.publicSite} <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
        <LanguageToggle compact />
        <Button type="button" variant="outline" size="sm" onClick={() => onThemeChange(nextTheme)}>
          <ThemeIcon className="h-4 w-4" />
          {nextTheme === "dark" ? t.dark : t.light}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onLock}>
          <LogOut className="h-4 w-4" />
          {t.lock}
        </Button>
      </div>
    </header>
  );
}