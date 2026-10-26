import { getCurrentSeason } from "@/lib/season";
import {
  filterEntries,
  metricValue,
  change,
  TREND_METRICS,
  TIME_FILTERS,
  TIME_FILTER_LABEL,
  type TimeFilter,
} from "@/lib/team-analytics";
import { getTeamStatEntries } from "@/lib/team-analytics-server";
import { buildRankings } from "@/lib/rankings";
import { formatPct, formatChange, getStatValue } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { TimeFilterSelector } from "@/components/analytics/TimeFilterSelector";
import { RankingCard } from "@/components/analytics/RankingCard";
import { cn } from "@/lib/cn";
import { format } from "date-fns";
import { getSeasonAnalyticsGames } from "@/lib/game-situations-server";
import { viewFromParam } from "@/lib/game-situations";
import { GameStatsFilters } from "@/components/analytics/GameStatsFilters";
import { GameAnalytics } from "@/components/analytics/GameAnalytics";
import styles from "@/components/analytics/analytics.module.css";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; situation?: string; game?: string }>;
}) {
  const { filter: filterParam, situation: situationParam, game: gameParam } = await searchParams;
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <EmptyState
          title="No season yet"
          description="Set up your season and team first."
          action={<ButtonLink href="/team">Go to Team</ButtonLink>}
        />
      </div>
    );
  }

  const filter: TimeFilter = TIME_FILTERS.includes(filterParam as TimeFilter) ? (filterParam as TimeFilter) : "SEASON";

  const allEntries = await getTeamStatEntries(season.id);
  const periodEntries = filterEntries(allEntries, filter);

  const rankings = await buildRankings(season.id);

  // Team game statistics by situation (All / 5-on-5 / PP / PK) — lib/game-situations.ts
  const view = viewFromParam(situationParam);
  const analyticsGames = (await getSeasonAnalyticsGames(season.id)).filter((g) => g.hasData);
  const selectedGame = analyticsGames.find((g) => g.id === gameParam) ?? null;
  const scopedGames = selectedGame ? [selectedGame] : analyticsGames;
  const gameOptions = [...analyticsGames].reverse().map((g) => ({
    id: g.id,
    label: `${format(g.date, "MMM d")} ${g.homeAway === "AWAY" ? "at" : "vs"} ${g.opponent}`,
  }));
  const gameStatsSection = (
    <div className={styles.root}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted">Overall Game Statistics</h2>
        <GameStatsFilters view={view} gameId={selectedGame?.id ?? null} games={gameOptions} />
      </div>
      {analyticsGames.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No game stats, results or special-teams numbers recorded yet this season.</p>
        </Card>
      ) : (
        <GameAnalytics
          games={scopedGames}
          view={view}
          scopeLabel={selectedGame ? gameOptions.find((o) => o.id === selectedGame.id)!.label : `Season ${season.name}`}
        />
      )}
    </div>
  );

  if (allEntries.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle={`Season ${season.name}`} />
        {gameStatsSection}
        <EmptyState
          title="No data yet"
          description="Log a game to see team trends here. (Mini Game trends live on the Mini Games tab, kept separate from official game analytics.)"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" subtitle={`Season ${season.name}`} />

      {gameStatsSection}

      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
          <h2 className="text-sm font-medium text-muted">5-on-5 Team Trends — {TIME_FILTER_LABEL[filter]} vs. Season Average</h2>
          <TimeFilterSelector current={filter} />
        </div>
        <Card padded={false}>
          <div className="grid grid-cols-4 border-b border-border text-xs text-muted uppercase tracking-wide">
            <div className="p-3">Metric</div>
            <div className="p-3 text-right">{TIME_FILTER_LABEL[filter]}</div>
            <div className="p-3 text-right">Season Average</div>
            <div className="p-3 text-right">Change</div>
          </div>
          {TREND_METRICS.map((m) => {
            const periodVal = metricValue(periodEntries, m.key, m.isPct);
            const seasonVal = metricValue(allEntries, m.key, m.isPct);
            const delta = change(periodVal, seasonVal);
            return (
              <div key={m.key} className="grid grid-cols-4 border-b border-border last:border-b-0 text-sm">
                <div className="p-3 text-muted">{m.label}</div>
                <div className="p-3 text-right font-medium">
                  {m.isPct ? formatPct(periodVal) : periodVal?.toFixed(1) ?? "—"}
                </div>
                <div className="p-3 text-right text-muted">
                  {m.isPct ? formatPct(seasonVal) : seasonVal?.toFixed(1) ?? "—"}
                </div>
                <div
                  className={cn(
                    "p-3 text-right font-medium",
                    delta !== null && delta > 0 && "text-positive",
                    delta !== null && delta < 0 && "text-negative"
                  )}
                >
                  {formatChange(delta)}
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted mb-3">5-on-5 Per-Game Breakdown</h2>
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted uppercase tracking-wide text-left">
                  <th className="p-3 whitespace-nowrap">Date</th>
                  <th className="p-3 whitespace-nowrap">Game</th>
                  {TREND_METRICS.map((m) => (
                    <th key={m.key} className="p-3 text-right whitespace-nowrap">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...allEntries].reverse().map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-b-0">
                    <td className="p-3 text-muted whitespace-nowrap">{format(e.date, "MMM d, yyyy")}</td>
                    <td className="p-3 font-medium text-foreground whitespace-nowrap">{e.label}</td>
                    {TREND_METRICS.map((m) => {
                      const value = getStatValue(e.stat, m.key);
                      return (
                        <td key={m.key} className="p-3 text-right">
                          {m.isPct ? formatPct(value) : value ?? 0}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted mb-3">Player Rankings · 5-on-5</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <RankingCard title="Top Performance Index" players={rankings.topPerformanceIndex} digits={1} />
          <RankingCard title="Most Improved" players={rankings.mostImproved} unit="%" digits={1} />
          <RankingCard title="Best Zone Entry %" players={rankings.bestZoneEntryPct} unit="%" digits={1} />
          <RankingCard title="Best Zone Exit %" players={rankings.bestZoneExitPct} unit="%" digits={1} />
          <RankingCard title="Lowest Giveaways" players={rankings.lowestGiveaways} />
          <RankingCard title="Most Scoring Chances" players={rankings.mostScoringChances} />
        </div>
      </div>
    </div>
  );
}
