import type { ComponentType } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardEmptyStateProps = {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
};

export function DashboardEmptyState({ title, description, icon: Icon = Inbox, className }: DashboardEmptyStateProps) {
  return (
    <div className={cn("rounded-md border border-dashed bg-background/70 px-4 py-5 text-center", className)}>
      <Icon className="mx-auto h-5 w-5 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p> : null}
    </div>
  );
}
