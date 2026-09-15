import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { glassPanel } from "@/components/dashboard/dashboardCardStyles";

const ICON_TONES = {
  accent: "bg-accent/15 text-accent-strong",
  teal: "bg-[color:var(--data-teal-bg)] text-[color:var(--data-teal)]",
  positive: "bg-positive-bg text-positive",
  negative: "bg-negative-bg text-negative",
  neutral: "bg-surface-raised text-muted",
} as const;

const GLYPH_TONES = {
  positive: "text-positive",
  negative: "text-negative",
} as const;

/** Dashboard-only premium tile used for the four Performance Snapshot cards. Purely presentational — every value it renders is passed in as children by the caller from the existing ranking/analytics data. `backgroundGlyph` is a large, low-opacity decorative character (e.g. an arrow) in the bottom-right corner; it carries no data of its own. */
export function SnapshotCard({
  icon,
  label,
  tone = "neutral",
  backgroundGlyph,
  glyphTone,
  topRight,
  children,
}: {
  icon: ReactNode;
  label: string;
  tone?: keyof typeof ICON_TONES;
  backgroundGlyph?: string;
  glyphTone?: keyof typeof GLYPH_TONES;
  topRight?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`${glassPanel} p-4 sm:p-5 min-h-[150px]`}>
      {backgroundGlyph && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -right-2 -bottom-4 text-7xl font-black opacity-[0.10] select-none",
            glyphTone && GLYPH_TONES[glyphTone]
          )}
        >
          {backgroundGlyph}
        </span>
      )}
      <div className="relative flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg text-sm shrink-0", ICON_TONES[tone])}>
            {icon}
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-2 truncate">{label}</p>
        </div>
        {topRight && <div className="shrink-0">{topRight}</div>}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
