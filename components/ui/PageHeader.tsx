import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** Tighter bottom margin for pages that need to fit more in one viewport (e.g. the Dashboard). */
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", compact ? "mb-3" : "mb-6")}>
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
