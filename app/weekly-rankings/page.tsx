import { getCurrentSeason } from "@/lib/season";
import { getCurrentWeekRankings, listWeeklyHistory } from "@/lib/weekly-rankings";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardTitle } from "@/components/ui/Card";
import { WeeklyPerformerRow, MEDALS } from "@/components/dashboard/WeeklyPerformerRow";
import { format } from "date-fns";

export default async function WeeklyRankingsPage() {
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div>
        <PageHeader title="Weekly Rankings" />
        <EmptyState title="No season set up yet" description="Set up your season and team to get started." />
      </div>
    );
  }

  const [current, history] = await Promise.all([
    getCurrentWeekRankings(season.id),
    listWeeklyHistory(season.id),
  ]);

  const dateRange = (start: Date, end: Date) => `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Weekly Rankings" subtitle={`Season ${season.name} · Top 3 / Bottom 3 performers, calculated automatically every week`} />

      <Card>
        <div className="mb-3">
          <CardTitle className="!mb-0.5">
            {current ? `Week ${current.weekNumber} — Current (${dateRange(current.weekStart, current.weekEnd)})` : "Current Week"}
          </CardTitle>
          <p className="text-xs text-muted-2">Live — recalculates as stats are entered. Archives automatically Sunday night.</p>
        </div>
        {!current || (current.top.length === 0 && current.bottom.length === 0) ? (
          <p className="text-sm text-muted">No practice or game stats logged yet this week.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-positive mb-2">🏆 Top Performers</p>
              <div className="space-y-2">
                {current.top.map((c, i) => (
                  <WeeklyPerformerRow key={c.playerId} candidate={c} medal={MEDALS[i]} tone="top" />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-negative mb-2">📉 Bottom Performers</p>
              <div className="space-y-2">
                {current.bottom.map((c) => (
                  <WeeklyPerformerRow key={c.playerId} candidate={c} tone="bottom" />
                ))}
              </div>
            </div>
          </div>
        )}
        {current && current.insufficientData.length > 0 && (
          <p className="mt-3 text-xs text-muted-2">
            {current.insufficientData.length} player(s) have insufficient data this week (fewer than{" "}
            {current.minEntriesRequired} logged entries) and aren&apos;t ranked.
          </p>
        )}
      </Card>

      <div>
        <h2 className="text-sm font-medium text-muted mb-2.5">Week History</h2>
        {history.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No completed weeks yet — the first week archives automatically after its Sunday night ends.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((week) => (
              <Card key={week.id}>
                <CardTitle className="!mb-3">
                  Week {week.weekNumber} ({dateRange(week.weekStart, week.weekEnd)})
                </CardTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-positive mb-2">🏆 Top Performers</p>
                    <div className="space-y-2">
                      {week.top.map((c, i) => (
                        <WeeklyPerformerRow key={c.playerId} candidate={c} medal={MEDALS[i]} tone="top" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-negative mb-2">📉 Bottom Performers</p>
                    <div className="space-y-2">
                      {week.bottom.map((c) => (
                        <WeeklyPerformerRow key={c.playerId} candidate={c} tone="bottom" />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
