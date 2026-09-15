// Shared visual tokens for the Dashboard-only "premium card" look (glass
// panels, depth, yellow accent glow). Kept local to components/dashboard so
// this styling never touches the shared components/ui/Card used everywhere
// else in the app — the redesign is scoped to the Dashboard page only.

export const glassPanel =
  "relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface-raised/90 to-surface shadow-[0_8px_30px_rgba(0,0,0,0.35)]";

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
