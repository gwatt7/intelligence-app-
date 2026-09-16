// Shared visual tokens for the Dashboard-only "premium card" look (glass
// panels, depth, yellow accent glow). Kept local to components/dashboard so
// this styling never touches the shared components/ui/Card used everywhere
// else in the app — the redesign is scoped to the Dashboard page only.

export const glassPanel =
  "relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface-raised/90 to-surface shadow-[0_8px_30px_rgba(0,0,0,0.35)]";

/**
 * Bold, neon-edge accent-color card treatment: a crisp bright border, an
 * ambient bloom just outside the card, and two inset shadow layers that pull
 * the same color in from every edge — a punchy ring right at the border,
 * then a softer fade reaching further in — instead of the color living only
 * in a thin outline. `border`/`glow`/`fade` are each a `var(--...)` CSS
 * custom property (same hue, decreasing alpha) so every category (positive,
 * negative, teal, gold, win/loss, ...) shares this one visual recipe.
 */
export function accentSurface(
  border: string,
  glow: string,
  fade: string
): { borderColor: string; borderWidth: string; boxShadow: string } {
  return {
    borderColor: border,
    borderWidth: "1.5px",
    boxShadow: [
      `0 0 12px -1px ${border}`,
      `0 0 38px -6px ${glow}`,
      `inset 0 0 32px -6px ${glow}`,
      `inset 0 0 130px -20px ${fade}`,
    ].join(", "),
  };
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
