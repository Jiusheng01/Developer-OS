"use client";

import { useEffect } from "react";
import { readLocalStorage } from "@/lib/storage/safe-local-storage";

const DASHBOARD_STORAGE_KEY = "developer-os-dashboard-state";

type ThemePreference = "light" | "dark" | "system";

function readThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const raw = readLocalStorage(DASHBOARD_STORAGE_KEY);
    if (!raw) return "dark";
    const parsed = JSON.parse(raw) as { preferences?: { theme?: unknown } };
    const theme = parsed.preferences?.theme;
    return theme === "light" || theme === "dark" || theme === "system" ? theme : "dark";
  } catch {
    return "dark";
  }
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
      if (event.key === DASHBOARD_STORAGE_KEY) {
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