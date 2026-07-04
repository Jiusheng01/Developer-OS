import { apiDashboardProvider } from "@/features/dashboard/data/api-dashboard-provider";
import type { DashboardDataProvider } from "@/features/dashboard/data/dashboard-data-provider";
import { localStorageDashboardProvider } from "@/features/dashboard/data/local-storage-dashboard-provider";

export type DashboardDataProviderMode = "local" | "api";

export function getDashboardDataProviderMode(): DashboardDataProviderMode {
  return process.env.NEXT_PUBLIC_DASHBOARD_DATA_PROVIDER === "api" ? "api" : "local";
}

export function getDashboardDataProvider(): DashboardDataProvider {
  return getDashboardDataProviderMode() === "api" ? apiDashboardProvider : localStorageDashboardProvider;
}