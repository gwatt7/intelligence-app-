import { Card, CardTitle } from "@/components/ui/Card";
import { PerformanceIndexBreakdown } from "@/lib/performance-index";

export function PerformanceIndexCard({ breakdown }: { breakdown: PerformanceIndexBreakdown | null }) {
  return (
    <Card>
      <CardTitle>Performance Index</CardTitle>
      {!breakdown ? (
        <p className="text-sm text-muted">No stats logged yet.</p>
      ) : (
        <>
          <p className="text-3xl font-bold text-accent-strong">{breakdown.score.toFixed(1)}</p>
          <p className="text-xs text-muted mt-1 mb-3">
            Weighted composite, 0-100 · a coaching tool, not an objective ranking
          </p>
          <div className="space-y-1.5">
            {breakdown.components.map((c) => (
              <div key={c.label} className="flex items-center justify-between text-xs">
                <span className="text-muted">
                  {c.label} <span className="text-muted-2">(×{c.weight})</span>
                </span>
                <span className="text-foreground font-mono">{c.contribution.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
