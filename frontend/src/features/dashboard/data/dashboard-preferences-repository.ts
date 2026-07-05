import type { DashboardTab } from "@/features/dashboard/types";
import { readLocalStorage, removeLocalStorage, writeLocalStorage } from "@/lib/storage/safe-local-storage";
import type { ThemePreference } from "@/lib/theme/theme-provider";

export const DASHBOARD_PREFERENCES_STORAGE_KEY = "developer-os-dashboard-preferences";

export type DashboardPreferences = {
  theme: ThemePreference;
  activeTab: DashboardTab;
};

const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  theme: "dark",
  activeTab: "today",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTheme(value: unknown): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : DEFAULT_DASHBOARD_PREFERENCES.theme;
}

function normalizeTab(value: unknown): DashboardTab {
  return value === "today" ||
    value === "todo" ||
    value === "learning" ||
    value === "notes" ||
    value === "goals" ||
    value === "settings"
    ? value
    : DEFAULT_DASHBOARD_PREFERENCES.activeTab;
}

export function normalizeDashboardPreferences(value: unknown): DashboardPreferences {
  if (!isRecord(value)) return DEFAULT_DASHBOARD_PREFERENCES;
  return {
    theme: normalizeTheme(value.theme),
    activeTab: normalizeTab(value.activeTab),
  };
}

export function loadDashboardPreferences(): DashboardPreferences {
  const raw = readLocalStorage(DASHBOARD_PREFERENCES_STORAGE_KEY);
  if (!raw) return DEFAULT_DASHBOARD_PREFERENCES;

  try {
    return normalizeDashboardPreferences(JSON.parse(raw) as unknown);
  } catch {
    return DEFAULT_DASHBOARD_PREFERENCES;
  }
}

export function saveDashboardPreferences(preferences: DashboardPreferences) {
  writeLocalStorage(DASHBOARD_PREFERENCES_STORAGE_KEY, JSON.stringify(normalizeDashboardPreferences(preferences)));
}

export function resetDashboardPreferences(): DashboardPreferences {
  removeLocalStorage(DASHBOARD_PREFERENCES_STORAGE_KEY);
  return DEFAULT_DASHBOARD_PREFERENCES;
}
