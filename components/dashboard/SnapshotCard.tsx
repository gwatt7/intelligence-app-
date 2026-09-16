import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { glassPanel, accentSurface } from "@/components/dashboard/dashboardCardStyles";

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

/** Dynamic card border + inward edge-fade — "teal" for a positive trend, "negative" for a declining one. Colors are display-only, driven by the caller's real calculated value (see app/page.tsx). */
const GLOW_STYLE = {
  teal: accentSurface("var(--data-teal-border)", "var(--data-teal-glow)", "var(--data-teal-fade)"),
  negative: accentSurface("var(--negative-border)", "var(--negative-glow)", "var(--negative-fade)"),
} as const;

const ARROW_COLOR = {
  teal: "var(--data-teal)",
  negative: "var(--negative)",
} as const;

/** Solid glowing up-trend arrow (Most Improved) — decorative only, no data of its own. */
function TrendUpArrow({ color }: { color: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className="pointer-events-none absolute right-3 bottom-3 h-10 w-10 sm:h-12 sm:w-12"
      style={{ filter: `drop-shadow(0 0 10px ${color})`, opacity: 0.85 }}
    >
      <path d="M8 40 L40 8" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M22 8 H40 V26" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/** Dashboard-only premium tile used for the four Performance Snapshot cards. Purely presentational — every value it renders is passed in as children by the caller from the existing ranking/analytics data. `backgroundGlyph` is a large, low-opacity decorative character (e.g. an arrow) in the bottom-right corner; it carries no data of its own. `glow`/`trendArrow` add the colored border+glow and the solid up-arrow shown in the reference design. */
export function SnapshotCard({
  icon,
  label,
  tone = "neutral",
  backgroundGlyph,
  glyphTone,
  topRight,
  glow,
  trendArrow,
  children,
}: {
  icon: ReactNode;
  label: string;
  tone?: keyof typeof ICON_TONES;
  backgroundGlyph?: string;
  glyphTone?: keyof typeof GLYPH_TONES;
  topRight?: ReactNode;
  glow?: keyof typeof GLOW_STYLE;
  trendArrow?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`${glassPanel} p-4 sm:p-5 min-h-[150px]`} style={glow ? GLOW_STYLE[glow] : undefined}>
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
      {trendArrow && <TrendUpArrow color={ARROW_COLOR[glow ?? "teal"]} />}
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
