import { Card, CardTitle } from "@/components/ui/Card";
import type { PlayerAvailabilitySummary } from "@/lib/player-availability";

/** Games Dressed / Scratched / Injured / On Schedule — separate from performance stats on purpose. Scratched and Injured games never appear as zero-performance games elsewhere in Northstar; this is the only place their count is shown. */
export function AvailabilityCard({ summary }: { summary: PlayerAvailabilitySummary }) {
  return (
    <Card>
      <CardTitle>Availability</CardTitle>
      <dl className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted">Games Dressed</dt>
          <dd className="mt-0.5 text-lg font-semibold text-foreground">{summary.gamesDressed}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Games Scratched</dt>
          <dd className="mt-0.5 text-lg font-semibold text-foreground">{summary.gamesScratched}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Games Injured</dt>
          <dd className="mt-0.5 text-lg font-semibold text-foreground">{summary.gamesInjured}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Games on Schedule</dt>
          <dd className="mt-0.5 text-lg font-semibold text-foreground">{summary.gamesOnSchedule}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted-2">
        Scratched and injured games never count toward games played, season totals, averages, percentages, Time on
        Ice, rankings, or comparisons — they&apos;re excluded entirely, not counted as a zero-performance game.
      </p>
    </Card>
  );
}
