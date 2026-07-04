import { Cloud, HardDrive } from "lucide-react";
import type { DashboardDataProviderMode } from "@/features/dashboard/data/provider-config";
import { cn } from "@/lib/utils";

type DashboardProviderBadgeProps = {
  mode: DashboardDataProviderMode;
  labels: Readonly<Record<DashboardDataProviderMode, string>>;
  className?: string;
};

export function DashboardProviderBadge({ mode, labels, className }: DashboardProviderBadgeProps) {
  const Icon = mode === "api" ? Cloud : HardDrive;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-secondary-foreground",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 text-primary" />
      {labels[mode]}
    </span>
  );
}
