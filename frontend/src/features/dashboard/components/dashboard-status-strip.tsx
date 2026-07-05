import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardStatusVariant = "ok" | "info" | "warning";

const variantStyles: Record<DashboardStatusVariant, string> = {
  ok: "border-primary/25 bg-primary/10 text-foreground",
  info: "border-border bg-card text-foreground",
  warning: "border-accent/40 bg-accent/10 text-foreground",
};

const iconStyles: Record<DashboardStatusVariant, string> = {
  ok: "text-primary",
  info: "text-muted-foreground",
  warning: "text-accent",
};

type DashboardStatusStripProps = {
  title: string;
  detail?: string;
  variant?: DashboardStatusVariant;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  className?: string;
};

export function DashboardStatusStrip({
  title,
  detail,
  variant = "info",
  actionLabel,
  onAction,
  actionDisabled,
  className,
}: DashboardStatusStripProps) {
  const Icon = variant === "warning" ? AlertTriangle : variant === "ok" ? CheckCircle2 : Info;

  return (
    <div className={cn("flex flex-col gap-3 rounded-md border px-3.5 py-3 text-sm sm:flex-row sm:items-start sm:justify-between", variantStyles[variant], className)}>
      <div className="flex min-w-0 items-start gap-3">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", iconStyles[variant])} />
        <div className="min-w-0">
          <p className="font-medium">{title}</p>
          {detail ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p> : null}
        </div>
      </div>
      {actionLabel && onAction ? (
        <Button type="button" size="sm" variant="outline" onClick={onAction} disabled={actionDisabled} className="shrink-0 self-start">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
