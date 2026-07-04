import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type DashboardSectionProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function DashboardSection({
  title,
  description,
  eyebrow,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
}: DashboardSectionProps) {
  return (
    <section className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0">
          {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</p> : null}
          <div className="flex min-w-0 items-center gap-2">
            {Icon ? <Icon className="h-4 w-4 shrink-0 text-primary" /> : null}
            <h2 className="truncate text-base font-semibold leading-none tracking-normal">{title}</h2>
          </div>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("px-4 pb-4 sm:px-5 sm:pb-5", contentClassName)}>{children}</div>
    </section>
  );
}
