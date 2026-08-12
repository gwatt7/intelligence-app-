import { Card, CardTitle } from "@/components/ui/Card";

type SeasonStat = {
  source: string | null;
  gamesPlayed: number | null;
  timeOnIceSeconds: number | null;
  corsiForPct: number | null;
  puckTouches: number | null;
  faceoffWinPct: number | null;
  faceoffWinPctDZ: number | null;
  faceoffWinPctNZ: number | null;
  faceoffWinPctOZ: number | null;
  goals: number | null;
  assists: number | null;
  takeaways: number | null;
  giveaways: number | null;
  scoringChances: number | null;
  shots: number | null;
  shotsOnGoal: number | null;
  expectedGoals: number | null;
  accuratePassPct: number | null;
  zoneEntries: number | null;
  breakouts: number | null;
  hits: number | null;
  blocks: number | null;
  plusMinus: number | null;
  powerPlayOpportunities: number | null;
  powerPlaySuccessful: number | null;
  powerPlayTimeSeconds: number | null;
  goalsAgainst: number | null;
  shotsAgainst: number | null;
  saves: number | null;
  savePct: number | null;
  shootoutSaves: number | null;
  shootoutsAllowed: number | null;
  scoringChancesAgainst: number | null;
  scoringChanceSaves: number | null;
  scoringChanceSavePct: number | null;
  rawStats: unknown;
  coachNotes: string | null;
};

function fmtDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtPct(v: number | null): string {
  return v === null ? "—" : `${v.toFixed(0)}%`;
}

function fmtNum(v: number | null): string {
  return v === null ? "—" : String(v);
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-base font-semibold text-foreground mt-0.5">{value}</dd>
    </div>
  );
}

export function HistoricalSeasonStatsCard({
  stat,
  isGoalie,
  seasonName,
}: {
  stat: SeasonStat;
  isGoalie: boolean;
  seasonName: string;
}) {
  const rawEntries = stat.rawStats && typeof stat.rawStats === "object" ? Object.entries(stat.rawStats as Record<string, unknown>) : [];

  return (
    <Card>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <CardTitle className="!mb-0">{seasonName} Season Totals</CardTitle>
        {stat.source && <span className="text-xs text-muted-2">{stat.source}</span>}
      </div>
      <p className="text-xs text-muted mb-4 -mt-2">
        Imported season aggregate — not tied to individual practices or games, so it isn&apos;t plotted as a
        game-by-game trend.
      </p>

      {isGoalie ? (
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatRow label="Games Played" value={fmtNum(stat.gamesPlayed)} />
          <StatRow label="Time on Ice" value={fmtDuration(stat.timeOnIceSeconds)} />
          <StatRow label="Goals Against" value={fmtNum(stat.goalsAgainst)} />
          <StatRow label="Shots Against" value={fmtNum(stat.shotsAgainst)} />
          <StatRow label="Saves" value={fmtNum(stat.saves)} />
          <StatRow label="Save %" value={fmtPct(stat.savePct)} />
          <StatRow label="Shootout Saves" value={fmtNum(stat.shootoutSaves)} />
          <StatRow label="Shootouts Allowed" value={fmtNum(stat.shootoutsAllowed)} />
          <StatRow label="Scoring Chances Against" value={fmtNum(stat.scoringChancesAgainst)} />
          <StatRow label="Scoring Chance Saves" value={fmtNum(stat.scoringChanceSaves)} />
          <StatRow label="Scoring Chance Save %" value={fmtPct(stat.scoringChanceSavePct)} />
        </dl>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">Overview</p>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatRow label="Games Played" value={fmtNum(stat.gamesPlayed)} />
              <StatRow label="Time on Ice" value={fmtDuration(stat.timeOnIceSeconds)} />
              <StatRow label="+/-" value={fmtNum(stat.plusMinus)} />
              <StatRow label="CORSI For %" value={fmtPct(stat.corsiForPct)} />
            </dl>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">Offense</p>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatRow label="Goals" value={fmtNum(stat.goals)} />
              <StatRow label="Assists" value={fmtNum(stat.assists)} />
              <StatRow
                label="Points"
                value={stat.goals === null && stat.assists === null ? "—" : String((stat.goals ?? 0) + (stat.assists ?? 0))}
              />
              <StatRow label="Shots" value={fmtNum(stat.shots)} />
              <StatRow label="Shots on Goal" value={fmtNum(stat.shotsOnGoal)} />
              <StatRow label="Scoring Chances" value={fmtNum(stat.scoringChances)} />
              <StatRow label="Expected Goals" value={fmtNum(stat.expectedGoals)} />
            </dl>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">Possession &amp; Transition</p>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatRow label="Puck Touches" value={fmtNum(stat.puckTouches)} />
              <StatRow label="Accurate Pass %" value={fmtPct(stat.accuratePassPct)} />
              <StatRow label="Zone Entries" value={fmtNum(stat.zoneEntries)} />
              <StatRow label="Breakouts" value={fmtNum(stat.breakouts)} />
            </dl>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">Defense</p>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatRow label="Takeaways" value={fmtNum(stat.takeaways)} />
              <StatRow label="Giveaways" value={fmtNum(stat.giveaways)} />
              <StatRow label="Hits" value={fmtNum(stat.hits)} />
              <StatRow label="Blocks" value={fmtNum(stat.blocks)} />
            </dl>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">Faceoffs</p>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatRow label="Win %" value={fmtPct(stat.faceoffWinPct)} />
              <StatRow label="Win % (DZ)" value={fmtPct(stat.faceoffWinPctDZ)} />
              <StatRow label="Win % (NZ)" value={fmtPct(stat.faceoffWinPctNZ)} />
              <StatRow label="Win % (OZ)" value={fmtPct(stat.faceoffWinPctOZ)} />
            </dl>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">Special Teams</p>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatRow label="Power Play Opportunities" value={fmtNum(stat.powerPlayOpportunities)} />
              <StatRow label="Successful Power Plays" value={fmtNum(stat.powerPlaySuccessful)} />
              <StatRow label="Power Play Time" value={fmtDuration(stat.powerPlayTimeSeconds)} />
            </dl>
          </div>
        </div>
      )}

      {stat.coachNotes && (
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-xs font-medium uppercase tracking-wide text-muted mb-2">Coach Notes</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{stat.coachNotes}</p>
        </div>
      )}

      {rawEntries.length > 0 && (
        <details className="mt-5 pt-4 border-t border-border">
          <summary className="text-xs font-medium uppercase tracking-wide text-muted cursor-pointer">
            Other Imported Metrics ({rawEntries.length}) — not yet mapped to a category
          </summary>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
            {rawEntries.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="text-sm text-foreground mt-0.5">{value === null || value === "" ? "—" : String(value)}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </Card>
  );
}
