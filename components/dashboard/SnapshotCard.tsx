import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { glassPanel } from "@/components/dashboard/dashboardCardStyles";

const ICON_TONES = {
  accent: "bg-accent/15 text-accent-strong",
  positive: "bg-positive-bg text-positive",
  negative: "bg-negative-bg text-negative",
  neutral: "bg-surface-raised text-muted",
} as const;

/** Dashboard-only premium tile used for the four Performance Snapshot cards. Purely presentational — every value it renders is passed in as children by the caller from the existing ranking/analytics data. */
export function SnapshotCard({
  icon,
  label,
  tone = "neutral",
  children,
}: {
  icon: ReactNode;
  label: string;
  tone?: keyof typeof ICON_TONES;
  children: ReactNode;
}) {
  return (
    <div className={`${glassPanel} p-4 sm:p-5`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-sm shrink-0", ICON_TONES[tone])}>
          {icon}
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-2 truncate">{label}</p>
      </div>
      {children}
    </div>
  );
}
