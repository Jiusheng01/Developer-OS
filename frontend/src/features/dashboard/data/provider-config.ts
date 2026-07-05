import { apiDashboardProvider } from "@/features/dashboard/data/api-dashboard-provider";
import type { DashboardDataProvider } from "@/features/dashboard/data/dashboard-data-provider";

export type DashboardDataProviderMode = "api";

export function getDashboardDataProviderMode(): DashboardDataProviderMode {
  return "api";
}

export function getDashboardDataProvider(): DashboardDataProvider {
  return apiDashboardProvider;
}
