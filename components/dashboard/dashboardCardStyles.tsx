// Shared visual tokens for the Dashboard-only card look — a near-black
// panel with a thin border, a soft top-to-bottom surface gradient, and a
// small, contained corner glow, matching the reference design's layered,
// not-flat depth (without the large blurred "neon" blobs spilling outside
// the card from the pre-redesign look). Kept local to components/dashboard
// so this styling never touches the shared components/ui/Card used
// everywhere else in the app — the redesign is scoped to the Dashboard
// page only.

export const flatPanel =
  "relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface-raised/55 to-surface shadow-[0_6px_22px_rgba(0,0,0,0.3)]";

/** Pre-redesign "glass" panel (gradient surface + deeper shadow) — kept
 * for components/mini-games/MiniGameTeamOverview.tsx, which is outside the
 * scope of the Dashboard-page visual redesign and must keep its existing
 * look untouched. New Dashboard cards use `flatPanel` above instead. */
export const glassPanel =
  "relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface-raised/90 to-surface shadow-[0_8px_30px_rgba(0,0,0,0.35)]";

/**
 * Colored card border for a card that needs to read as "featured" or
 * "flagged" (Next Game, the Weekly Rankings banner, a win/loss result, a
 * ranking standout) — a thin, crisp colored line plus a small bloom that
 * stays close to the card rather than spilling far into the page behind
 * it. `border`/`glow` are `var(--...)` CSS custom properties so every
 * category (positive, negative, teal, gold, win/loss, ...) shares this one
 * visual recipe.
 */
export function accentSurface(border: string, glow: string): { borderColor: string; boxShadow: string } {
  return {
    borderColor: border,
    boxShadow: `0 0 0 1px ${border}, 0 10px 34px -8px ${glow}`,
  };
}

/**
 * The "inside" half of the accent treatment: a soft glowing light source
 * anchored to the card's bottom-right corner, contained well within the
 * card's own bounds (per the reference, where the glow is a subtle wash in
 * the corner, not a dramatic bloom). Render as the first child inside a
 * `relative overflow-hidden` card so it sits behind the real content and
 * gets clipped to the card's rounded corners. Purely decorative — carries
 * no data of its own.
 */
export function AccentGlowCorner({ glow, fade }: { glow: string; fade: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full blur-2xl opacity-90"
      style={{ background: `radial-gradient(circle, ${glow}, ${fade} 60%, transparent 80%)` }}
    />
  );
}

/** Pre-redesign "neon-edge" border — kept for
 * components/mini-games/MiniGameTeamOverview.tsx (see `glassPanel` above);
 * new Dashboard cards use `accentSurface` instead. */
export function accentSurfaceGlow(border: string, glow: string): { borderColor: string; boxShadow: string } {
  return {
    borderColor: border,
    boxShadow: `16px 16px 46px -10px ${glow}`,
  };
}

/** Pre-redesign large blurred corner glow — kept for
 * components/mini-games/MiniGameTeamOverview.tsx (see `glassPanel` above);
 * new Dashboard cards use `AccentGlowCorner` instead. */
export function AccentGlowCornerLarge({ glow, fade }: { glow: string; fade: string }) {
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
