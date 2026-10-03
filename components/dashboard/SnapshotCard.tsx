import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { flatPanel, accentSurface, AccentGlowCorner } from "@/components/dashboard/dashboardCardStyles";

const ICON_TONES = {
  accent: "bg-accent/15 text-accent-strong",
  teal: "bg-[color:var(--data-teal-bg)] text-[color:var(--data-teal)]",
  positive: "bg-positive-bg text-positive",
  negative: "bg-negative-bg text-negative",
  neutral: "bg-surface-raised text-muted",
} as const;

/** Dynamic card border — "teal" for a positive trend, "negative" for a
 * declining one. Colors are display-only, driven by the caller's real
 * calculated value (see app/page.tsx). Paired with AccentGlowCorner below
 * for the corner light-source glow. */
const GLOW_STYLE = {
  teal: accentSurface("var(--data-teal-border)", "var(--data-teal-glow)"),
  negative: accentSurface("var(--negative-border)", "var(--negative-glow)"),
} as const;

const ARROW_COLOR = {
  teal: "var(--data-teal)",
  negative: "var(--negative)",
} as const;

const CORNER_GLOW = {
  teal: { glow: "var(--data-teal-glow)", fade: "var(--data-teal-fade)" },
  negative: { glow: "var(--negative-glow)", fade: "var(--negative-fade)" },
} as const;

/** Dashboard-only tile used for the Performance Snapshot row. Purely
 * presentational — every value it renders is passed in as children by the
 * caller from the existing ranking/analytics data. `glow` adds the colored
 * border + inward corner glow; `trendArrow` adds the matching up/down
 * indicator shown in the reference (color follows `glow`); `tealTint`
 * washes the whole card in a translucent teal fill, matching the
 * reference's Team Trend card specifically (the other tiles stay flat even
 * when their own value/arrow is teal-colored). */
export function SnapshotCard({
  icon,
  label,
  tone = "neutral",
  topRight,
  glow,
  trendArrow,
  tint,
  children,
}: {
  icon: ReactNode;
  label: string;
  tone?: keyof typeof ICON_TONES;
  topRight?: ReactNode;
  glow?: keyof typeof GLOW_STYLE;
  trendArrow?: "up" | "down";
  /** Full translucent background wash in this color, matching the
   * reference's Team Trend card specifically — the other tiles stay flat
   * even when their own value/arrow is colored. */
  tint?: keyof typeof GLOW_STYLE;
  children: ReactNode;
}) {
  const ArrowIcon = trendArrow === "up" ? TrendingUp : TrendingDown;
  const tintBg = { teal: "var(--data-teal-bg)", negative: "var(--negative-bg)" } as const;
  return (
    <div
      className={cn(flatPanel, "p-4 sm:p-5 min-h-[150px]")}
      style={{
        ...(glow ? GLOW_STYLE[glow] : undefined),
        ...(tint ? { backgroundImage: `linear-gradient(160deg, ${tintBg[tint]}, var(--surface) 70%)` } : undefined),
      }}
    >
      {glow && <AccentGlowCorner {...CORNER_GLOW[glow]} />}
      {trendArrow && (
        <ArrowIcon
          aria-hidden
          strokeWidth={1.75}
          className="pointer-events-none absolute right-3 bottom-3 h-9 w-9 sm:h-10 sm:w-10 opacity-70"
          style={{ color: ARROW_COLOR[glow ?? "teal"], filter: `drop-shadow(0 0 8px ${ARROW_COLOR[glow ?? "teal"]})` }}
        />
      )}
      <div className="relative flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0", ICON_TONES[tone])}>
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
