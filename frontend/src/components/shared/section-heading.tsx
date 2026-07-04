import { cn } from "@/lib/utils";

export function SectionHeading({
  label,
  title,
  description,
  className,
}: {
  label?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {label ? <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{label}</p> : null}
      <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">{title}</h1>
      {description ? <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p> : null}
    </div>
  );
}