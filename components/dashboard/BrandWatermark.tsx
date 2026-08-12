// Dashboard-only background treatment. There is no separate NORTHSTAR logo
// asset in the project — the brand mark today is the wordmark itself (as
// used in the nav) — so this reuses that same text rather than inventing a
// new graphic. Purely decorative: aria-hidden, non-interactive, and layered
// well behind real content.
export function BrandWatermark() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      <span
        className="absolute -right-3 bottom-6 whitespace-nowrap text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight text-accent/[0.05]"
        style={{ textShadow: "0 0 60px rgba(252,211,6,0.16)" }}
      >
        NORTHSTAR
      </span>
    </div>
  );
}
