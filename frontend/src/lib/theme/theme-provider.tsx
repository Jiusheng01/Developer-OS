"use client";

import { useEffect } from "react";
import {
  DASHBOARD_PREFERENCES_STORAGE_KEY,
  loadDashboardPreferences,
} from "@/features/dashboard/data/dashboard-preferences-repository";

type ThemePreference = "light" | "dark" | "system";

function readThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "dark";
  }

  return loadDashboardPreferences().theme;
}

function applyTheme(theme: ThemePreference) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", shouldUseDark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyTheme(readThemePreference());

    function handleStorage(event: StorageEvent) {
      if (event.key === DASHBOARD_PREFERENCES_STORAGE_KEY) {
        applyTheme(readThemePreference());
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return children;
}

export { applyTheme, readThemePreference };
export type { ThemePreference };
