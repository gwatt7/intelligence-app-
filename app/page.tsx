import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { metricValue, change } from "@/lib/team-analytics";
import { getTeamStatEntries } from "@/lib/team-analytics-server";
import { buildRankings } from "@/lib/rankings";
import { getCurrentWeekRankings } from "@/lib/weekly-rankings";
import { formatChange, zoneEntryPct, zoneExitPct } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { WeeklyPerformanceSection } from "@/components/dashboard/WeeklyPerformanceSection";
import { NextGameCard } from "@/components/dashboard/NextGameCard";
import { LastGameCard } from "@/components/dashboard/LastGameCard";
import { NextMiniGameCard } from "@/components/dashboard/NextMiniGameCard";
import { SnapshotCard } from "@/components/dashboard/SnapshotCard";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { glassPanel } from "@/components/dashboard/dashboardCardStyles";
import { PlayerPhoto } from "@/components/players/PlayerPhoto";

export default async function DashboardPage() {
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <EmptyState
          title="Welcome to NORTHSTAR"
          description="Start by creating your season and team."
          action={<ButtonLink href="/team">Set Up Season & Team</ButtonLink>}
        />
      </div>
    );
  }

  const now = new Date();

  const [nextGame, lastGame, nextMiniGame, team] = await Promise.all([
    prisma.game.findFirst({ where: { seasonId: season.id, date: { gte: now } }, orderBy: { date: "asc" } }),
    prisma.game.findFirst({
      where: { seasonId: season.id, isCompleted: true, date: { lte: now } },
      orderBy: { date: "desc" },
    }),
    prisma.miniGame.findFirst({ where: { seasonId: season.id, date: { gte: now } }, orderBy: { date: "asc" } }),
    prisma.team.findUnique({ where: { seasonId: season.id } }),
  ]);

  const teamEntries = await getTeamStatEntries(season.id);
  const last5 = teamEntries.slice(-5);
  const entryTrend = change(metricValue(last5, "zoneEntryPct", true), metricValue(teamEntries, "zoneEntryPct", true));
  const exitTrend = change(metricValue(last5, "zoneExitPct", true), metricValue(teamEntries, "zoneExitPct", true));
  const teamTrend =
    entryTrend !== null && exitTrend !== null ? (entryTrend + exitTrend) / 2 : entryTrend ?? exitTrend;

  // Real per-game series (zone entry/exit % averaged per game) for the Team
  // Trend sparkline — the same last-5-games window as teamTrend above, just
  // plotted point-by-point instead of collapsed to one delta.
  const teamTrendSeries = last5
    .map((e) => {
      const entryPct = zoneEntryPct(e.stat);
      const exitPct = zoneExitPct(e.stat);
      if (entryPct === null && exitPct === null) return null;
      if (entryPct === null) return exitPct;
      if (exitPct === null) return entryPct;
      return (entryPct + exitPct) / 2;
    })
    .filter((v): v is number => v !== null);

  // Team Trend's card color follows the sign of the same teamTrend value
  // above — positive (or flat) reads as the team's brand teal, a genuine
  // decline reads red. Purely a display choice; the number itself is
  // unchanged.
  const teamTrendGlow = teamTrend === null ? null : teamTrend < 0 ? "negative" : "teal";
  const teamTrendColor = teamTrendGlow ? `var(--${teamTrendGlow === "teal" ? "data-teal" : "negative"})` : undefined;

  const rankings = await buildRankings(season.id);
  const weeklyRankings = await getCurrentWeekRankings(season.id);
  const topPerformer = rankings.topPerformanceIndex[0];
  const mostImproved = rankings.mostImproved[0];
  const needsAttention = [...rankings.topPerformanceIndex].sort((a, b) => a.value - b.value)[0];

  const lastGameResult =
    lastGame && lastGame.ourScore !== null && lastGame.opponentScore !== null
      ? lastGame.ourScore > lastGame.opponentScore
        ? "W"
        : lastGame.ourScore < lastGame.opponentScore
        ? "L"
        : "T"
      : null;

  return (
    <DashboardHero teamName={team?.name ?? "Team"} seasonName={season.name}>
      <div className="space-y-6">
        {/* Game + Mini Game context — Next Game is the visually dominant card */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <NextGameCard game={nextGame} now={now} />
          <LastGameCard game={lastGame} result={lastGameResult} />
          <NextMiniGameCard miniGame={nextMiniGame} />
        </div>

        {/* Performance snapshot */}
        <div>
          <h2 className="text-sm font-medium text-muted mb-2.5">Performance Snapshot</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            <SnapshotCard
              icon="📊"
              label="Team Trend"
              tone="accent"
              glow={teamTrendGlow ?? undefined}
              topRight={
                teamTrendSeries.length > 1 ? <Sparkline points={teamTrendSeries} color={teamTrendColor} /> : undefined
              }
            >
              {teamTrend !== null ? (
                <p className="text-2xl font-bold" style={{ color: teamTrendColor }}>
                  {formatChange(teamTrend)}
                </p>
              ) : (
                <TrendBadge value={teamTrend} />
              )}
              <p className="text-xs text-muted mt-2">Zone entry/exit, last 5 vs. season</p>
            </SnapshotCard>

            {/* Top Performer — its own bespoke layout (photo bleeding to the
                card edge) rather than the shared icon+value SnapshotCard
                shape, matching the reference. Still the real ranked player
                and their real photo (or the same blank silhouette used
                everywhere else when none is set). */}
            <div
              className={`${glassPanel} p-4 sm:p-5 min-h-[150px]`}
              style={{ borderColor: "var(--accent-border)", boxShadow: "0 0 26px -6px var(--accent-glow)" }}
            >
              {topPerformer && (
                <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-24">
                  <div className="absolute inset-0 z-10 bg-gradient-to-r from-surface via-surface/70 to-transparent" />
                  <PlayerPhoto
                    photoUrl={topPerformer.photoUrl}
                    size="md"
                    variant="boxed"
                    className="!h-full !w-full !rounded-none"
                  />
                </div>
              )}
              <div className="relative flex items-center gap-2 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-sm shrink-0 bg-accent/15 text-accent-strong">
                  👥
                </span>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-2 truncate">Top Performer</p>
              </div>
              {topPerformer ? (
                <div className="relative pr-14 sm:pr-16">
                  <p className="text-2xl font-bold text-foreground">#{topPerformer.jerseyNumber}</p>
                  <p className="text-sm text-foreground truncate">{topPerformer.name}</p>
                  <p className="text-xs text-muted mt-0.5">Index {topPerformer.value.toFixed(1)}</p>
                </div>
              ) : (
                <p className="relative text-sm text-muted">No data yet.</p>
              )}
            </div>

            <SnapshotCard icon="⭐" label="Most Improved" tone="accent" glow="teal" trendArrow>
              {mostImproved ? (
                <>
                  <p className="text-2xl font-bold" style={{ color: "var(--data-teal)" }}>
                    {formatChange(mostImproved.value)}
                  </p>
                  <p className="text-sm text-foreground mt-1 truncate">
                    #{mostImproved.jerseyNumber} {mostImproved.name}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">No data yet.</p>
              )}
            </SnapshotCard>

            <SnapshotCard icon="🎯" label="Needs Attention" tone="negative" backgroundGlyph="↓" glyphTone="negative">
              {needsAttention ? (
                <>
                  <p className="text-sm font-semibold text-foreground truncate">
                    #{needsAttention.jerseyNumber} {needsAttention.name}
                  </p>
                  <p className="text-xs text-muted mt-1">Index {needsAttention.value.toFixed(1)}</p>
                </>
              ) : (
                <p className="text-sm text-muted">No data yet.</p>
              )}
            </SnapshotCard>
          </div>
        </div>

        {/* Weekly Performance Rankings — Top 3 / Bottom 3 of the current week */}
        <WeeklyPerformanceSection result={weeklyRankings} historyHref="/weekly-rankings" />
      </div>
    </DashboardHero>
  );
}
