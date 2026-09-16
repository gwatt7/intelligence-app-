// Shared visual tokens for the Dashboard-only "premium card" look (glass
// panels, depth, yellow accent glow). Kept local to components/dashboard so
// this styling never touches the shared components/ui/Card used everywhere
// else in the app — the redesign is scoped to the Dashboard page only.

export const glassPanel =
  "relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface-raised/90 to-surface shadow-[0_8px_30px_rgba(0,0,0,0.35)]";

/**
 * Neon-edge card border, matching the reference look: a thin, crisp colored
 * line plus a soft bloom that visibly bleeds outside the card's own rounded
 * corner into the page behind it (box-shadow is drawn from the border-box
 * outward, so it isn't clipped by the card's own `overflow-hidden`, unlike
 * a child element would be). The bloom is offset toward the bottom-right
 * corner — the same corner the card's glow blob (see `AccentGlowCorner`)
 * and trend arrow live in — so the two line up as one light source rather
 * than two independent effects. `border`/`glow` are `var(--...)` CSS custom
 * properties so every category (positive, negative, teal, gold, win/loss,
 * ...) shares this one visual recipe.
 */
export function accentSurface(border: string, glow: string): { borderColor: string; boxShadow: string } {
  return {
    borderColor: border,
    boxShadow: `16px 16px 46px -10px ${glow}`,
  };
}

/**
 * The "inside" half of the neon-edge treatment: a soft glowing light source
 * anchored to the card's bottom-right corner (where the trend arrow, when
 * present, also lives) rather than a wash spread evenly across the whole
 * card. Two stacked blurred circles — a smaller brighter core (`glow`) and
 * a larger softer halo (`fade`) — reproduce the reference's radial falloff:
 * strong right at the corner, fading to nothing well before the card's own
 * text. Render as the first child inside a `relative overflow-hidden` card
 * so it sits behind the real content and gets clipped to the card's rounded
 * corners. Purely decorative — carries no data of its own.
 */
export function AccentGlowCorner({ glow, fade }: { glow: string; fade: string }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 sm:h-36 sm:w-36 rounded-full blur-2xl"
        style={{ backgroundColor: glow }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -bottom-16 h-56 w-56 sm:h-64 sm:w-64 rounded-full blur-3xl"
        style={{ backgroundColor: fade }}
      />
    </>
  );
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
