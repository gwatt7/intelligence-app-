import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { display } from "@/components/dashboard/dashboardUi";

/**
 * One cell of the Performance Snapshot row. Purely presentational — every
 * value is passed in as children by the dashboard page from the existing
 * analytics/ranking data.
 */
export function SnapshotCard({
  label,
  highlight = false,
  className,
  children,
}: {
  label: ReactNode;
  /** Gold-filled cell (Team Trend in the reference). */
  highlight?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("relative min-h-[134px] px-[21px] pb-[15px] pt-[19px]", highlight ? "bg-[#f4b700]" : "bg-white", className)}>
      <p
        className={cn(
          `${display} flex items-center gap-[6px] text-[13px] font-semibold uppercase leading-[16px] tracking-[0.14em]`,
          highlight ? "text-[#0d1116]" : "text-[#4b525b]"
        )}
      >
        {label}
      </p>
      <div className="mt-[14px]">{children}</div>
    </div>
  );
}
