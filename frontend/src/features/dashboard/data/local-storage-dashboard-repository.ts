import {
  hasDashboardStateShape,
  normalizeDashboardState,
  sanitizeDashboardStateForPersistence,
} from "@/features/dashboard/data/dashboard-normalizers";
import { createDefaultDashboardState } from "@/features/dashboard/data/dashboard-defaults";
import type { DashboardExport, DashboardImportResult, DashboardState } from "@/features/dashboard/types";
import { readLocalStorage, removeLocalStorage, writeLocalStorage } from "@/lib/storage/safe-local-storage";

export { normalizeDashboardState } from "@/features/dashboard/data/dashboard-normalizers";

export const DASHBOARD_STORAGE_KEY = "developer-os-dashboard-state";

export function createDashboardExport(state: DashboardState): DashboardExport {
  return {
    exportedAt: new Date().toISOString(),
    source: "developer-os",
    state: sanitizeDashboardStateForPersistence(state),
  };
}

export function serializeDashboardExport(state: DashboardState): string {
  return JSON.stringify(createDashboardExport(state), null, 2);
}

export function parseDashboardImport(raw: string): DashboardImportResult {
  if (!raw.trim()) return { ok: false, error: "empty" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "invalid-json" };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: "invalid-shape" };
  }

  const record = parsed as Record<string, unknown>;

  if ("state" in record || "source" in record || "exportedAt" in record) {
    if (record.source !== "developer-os") return { ok: false, error: "invalid-source" };
    if (!hasDashboardStateShape(record.state)) return { ok: false, error: "invalid-shape" };
    return { ok: true, state: normalizeDashboardState(record.state) };
  }

  if (!hasDashboardStateShape(record)) return { ok: false, error: "invalid-shape" };
  return { ok: true, state: normalizeDashboardState(record) };
}

export function loadDashboardState(): DashboardState {
  const raw = readLocalStorage(DASHBOARD_STORAGE_KEY);
  if (!raw) return createDefaultDashboardState();

  try {
    return normalizeDashboardState(JSON.parse(raw));
  } catch {
    return createDefaultDashboardState();
  }
}

export function saveDashboardState(state: DashboardState) {
  writeLocalStorage(DASHBOARD_STORAGE_KEY, JSON.stringify(sanitizeDashboardStateForPersistence(state)));
}

export function resetDashboardState() {
  removeLocalStorage(DASHBOARD_STORAGE_KEY);
  return createDefaultDashboardState();
}