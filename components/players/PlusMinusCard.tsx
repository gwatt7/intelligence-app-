import { Card, CardTitle } from "@/components/ui/Card";
import { TrendChart } from "@/components/charts/TrendChart";
import { formatPlusMinus } from "@/lib/stats";
import type { PlayerPlusMinusSummary } from "@/lib/player-analytics";
import { format } from "date-fns";

/** Plus/Minus — skaters only (see lib/player-availability.ts / PlusMinusCard usage: the caller never renders this for a goalie). Season total, per-game log, average, and progression — manually entered per game, availability-aware (Scratched/Injured games are excluded, never a zero-performance game). */
export function PlusMinusCard({ summary, firstName }: { summary: PlayerPlusMinusSummary; firstName: string }) {
  if (summary.games.length === 0) {
    return (
      <Card>
        <CardTitle>Plus/Minus</CardTitle>
        <p className="text-sm text-muted">
          No official games logged for {firstName} yet. Plus/Minus is entered manually alongside each game&apos;s
          stats.
        </p>
      </Card>
    );
  }

  const chart = summary.games.map((g) => ({ label: `${format(g.date, "MMM d")} ${g.label}`, value: g.plusMinus }));

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Plus/Minus</CardTitle>
        <dl className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">Season Total</dt>
            <dd className="mt-0.5 text-lg font-semibold text-foreground">{formatPlusMinus(summary.seasonTotal)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Avg / Game</dt>
            <dd className="mt-0.5 text-lg font-semibold text-foreground">
              {summary.averagePerGame !== null ? formatPlusMinus(Math.round(summary.averagePerGame * 100) / 100) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Games</dt>
            <dd className="mt-0.5 text-lg font-semibold text-foreground">{summary.games.length}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardTitle>Plus/Minus Over Time</CardTitle>
        <TrendChart data={chart} />
      </Card>

      <Card>
        <CardTitle>Plus/Minus — Game Log</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4">Game</th>
                <th className="py-2 pr-4">+/-</th>
              </tr>
            </thead>
            <tbody>
              {[...summary.games].reverse().map((g) => (
                <tr key={g.gameId} className="border-t border-border">
                  <td className="whitespace-nowrap py-2 pr-4 text-muted">
                    {format(g.date, "MMM d")} {g.label}
                  </td>
                  <td
                    className={
                      g.plusMinus > 0 ? "py-2 pr-4 font-medium text-positive" : g.plusMinus < 0 ? "py-2 pr-4 font-medium text-negative" : "py-2 pr-4"
                    }
                  >
                    {formatPlusMinus(g.plusMinus)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
