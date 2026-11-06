import { Card, CardTitle } from "@/components/ui/Card";
import { formatIceTime } from "@/lib/situation-stats";
import type { PlayerToiSummary } from "@/lib/player-analytics";
import { format } from "date-fns";

/** Time on Ice — 5-on-5 (GamePlayerStat) + Power Play / Penalty Kill
 * (GameSituationStat) combined per game, plus season totals and the
 * per-game log. All manually entered; Northstar has no automated
 * video-based shift tracking yet, so nothing here is estimated. */
export function TimeOnIceCard({ summary, firstName }: { summary: PlayerToiSummary; firstName: string }) {
  if (summary.games.length === 0) {
    return (
      <Card>
        <CardTitle>Time on Ice</CardTitle>
        <p className="text-sm text-muted">
          No official games logged for {firstName} yet. Ice time is entered manually alongside each game&apos;s
          5-on-5, Power Play and Penalty Kill stats.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Time on Ice</CardTitle>
        <dl className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <dt className="text-xs text-muted">Season Total</dt>
            <dd className="mt-0.5 text-lg font-semibold text-foreground">{formatIceTime(summary.seasonTotalSeconds)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Avg / Game</dt>
            <dd className="mt-0.5 text-lg font-semibold text-foreground">
              {summary.averagePerGameSeconds !== null ? formatIceTime(summary.averagePerGameSeconds) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">5-on-5</dt>
            <dd className="mt-0.5 text-lg font-semibold text-foreground">{formatIceTime(summary.seasonEvenSeconds)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Power Play</dt>
            <dd className="mt-0.5 text-lg font-semibold text-foreground">{formatIceTime(summary.seasonPowerPlaySeconds)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Penalty Kill</dt>
            <dd className="mt-0.5 text-lg font-semibold text-foreground">{formatIceTime(summary.seasonPenaltyKillSeconds)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-2">
          Manually entered alongside each game&apos;s stats — Northstar has no automated video-based shift tracking
          yet, so nothing here is estimated.
        </p>
      </Card>

      <Card>
        <CardTitle>Time on Ice — Game Log</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4">Game</th>
                <th className="py-2 pr-4">5-on-5</th>
                <th className="py-2 pr-4">Power Play</th>
                <th className="py-2 pr-4">Penalty Kill</th>
                <th className="py-2 pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...summary.games].reverse().map((g) => (
                <tr key={g.gameId} className="border-t border-border">
                  <td className="whitespace-nowrap py-2 pr-4 text-muted">
                    {format(g.date, "MMM d")} {g.label}
                  </td>
                  <td className="py-2 pr-4">{formatIceTime(g.evenSeconds)}</td>
                  <td className="py-2 pr-4">{formatIceTime(g.powerPlaySeconds)}</td>
                  <td className="py-2 pr-4">{formatIceTime(g.penaltyKillSeconds)}</td>
                  <td className="py-2 pr-4 font-medium text-foreground">{formatIceTime(g.totalSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
