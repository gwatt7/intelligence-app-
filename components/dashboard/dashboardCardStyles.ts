// Shared visual tokens for the Dashboard-only "premium card" look (glass
// panels, depth, yellow accent glow). Kept local to components/dashboard so
// this styling never touches the shared components/ui/Card used everywhere
// else in the app — the redesign is scoped to the Dashboard page only.

export const glassPanel =
  "relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface-raised/90 to-surface shadow-[0_8px_30px_rgba(0,0,0,0.35)]";

/**
 * Bold accent-color card treatment: a saturated solid border, a soft
 * ambient glow just outside the card, and two inset shadow layers that pull
 * the same color in from every edge — strong right at the border, fading to
 * nothing well before the center — instead of the color living only in a
 * thin outline. `border`/`glow`/`fade` are each a `var(--...)` CSS custom
 * property (same hue, decreasing alpha) so every category (positive,
 * negative, teal, gold, win/loss, ...) shares this one visual recipe.
 */
export function accentSurface(border: string, glow: string, fade: string): { borderColor: string; boxShadow: string } {
  return {
    borderColor: border,
    boxShadow: [
      `0 0 30px -8px ${glow}`,
      `inset 0 0 22px -4px ${glow}`,
      `inset 0 0 110px -18px ${fade}`,
    ].join(", "),
  };
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
