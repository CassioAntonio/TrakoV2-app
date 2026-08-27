import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Screen({
  title,
  subtitle,
  action,
  children,
  padded = true,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  padded?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("app-scroll flex h-full flex-col", className)}>
      {title && (
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/60 bg-background/90 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.9rem)] backdrop-blur">
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold">{title}</h1>
            {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={cn("flex-1", padded && "space-y-4 px-4 py-4")}>{children}</div>
    </div>
  );
}

export function StatTile({
  label,
  value,
  unit,
  accent,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("surface-card px-3 py-3", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className={cn("metric-value text-2xl", accent && "text-primary")}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center gap-3 px-6 py-10 text-center animate-rise">
      {icon && <div className="text-primary">{icon}</div>}
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between pt-1">
      <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
        {children}
      </h2>
      {action}
    </div>
  );
}
