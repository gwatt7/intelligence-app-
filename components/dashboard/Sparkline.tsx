/** Tiny inline sparkline for the Team Trend snapshot card. Every point it
 * draws is a real value passed in by the caller (see app/page.tsx, derived
 * from the same per-game team stat entries the rest of the app uses) —
 * this never invents data, and renders nothing when there are fewer than
 * two real points to connect. */
export function Sparkline({ points, width = 64, height = 28 }: { points: number[]; width?: number; height?: number }) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - min) / range) * height;
    return [x, y] as const;
  });

  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden>
      <path d={path} fill="none" stroke="var(--data-teal)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.25" fill="var(--data-teal)" />
    </svg>
  );
}
