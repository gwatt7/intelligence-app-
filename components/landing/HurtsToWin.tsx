// "HURTS TO WIN" slogan: black lettering, a white outline, then an outer
// gold outline, matching the Northstar logo's layered style.
// Drawn as three stacked SVG text layers (gold stroke, white stroke, black
// fill) so both outlines stay crisp at any size.
export function HurtsToWin({ className }: { className?: string }) {
  const text = "HURTS TO WIN";
  const shared = {
    x: 320,
    y: 74,
    textAnchor: "middle" as const,
    fontSize: 72,
    fontWeight: 900,
    fontStyle: "italic",
    letterSpacing: 4,
    textLength: 580,
    lengthAdjust: "spacingAndGlyphs" as const,
    style: { fontFamily: "var(--font-geist-sans), Arial Black, Arial, sans-serif" },
  };

  return (
    <svg viewBox="0 0 640 100" role="img" aria-label={text} className={className}>
      <text {...shared} fill="#fcd306" stroke="#fcd306" strokeWidth={18} strokeLinejoin="round" aria-hidden>
        {text}
      </text>
      <text {...shared} fill="#ffffff" stroke="#ffffff" strokeWidth={9} strokeLinejoin="round" aria-hidden>
        {text}
      </text>
      <text {...shared} fill="#000000" aria-hidden>
        {text}
      </text>
    </svg>
  );
}
