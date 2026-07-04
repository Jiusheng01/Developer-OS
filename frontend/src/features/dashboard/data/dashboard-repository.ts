import type { DashboardState } from "@/features/dashboard/types";

export type DashboardRepository = {
  load(): DashboardState;
  save(state: DashboardState): void;
  reset(): DashboardState;
};