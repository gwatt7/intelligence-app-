import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { metricValue, change } from "@/lib/team-analytics";
import { getTeamStatEntries } from "@/lib/team-analytics-server";
import { buildRankings } from "@/lib/rankings";
import { getCurrentWeekRankings } from "@/lib/weekly-rankings";
import { formatChange } from "@/lib/stats";
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <NextGameCard game={nextGame} now={now} />
          <LastGameCard game={lastGame} result={lastGameResult} />
          <NextMiniGameCard miniGame={nextMiniGame} />
        </div>

        {/* Performance snapshot */}
        <div>
          <h2 className="text-sm font-medium text-muted mb-2.5">Performance Snapshot</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SnapshotCard icon="📊" label="Team Trend" tone="accent">
              <TrendBadge value={teamTrend} />
              <p className="text-xs text-muted mt-2">Zone entry/exit, last 5 vs. season</p>
            </SnapshotCard>

            <SnapshotCard icon="⭐" label="Top Performer" tone="accent">
              {topPerformer ? (
                <div className="flex items-center gap-3">
                  <PlayerPhoto photoUrl={topPerformer.photoUrl} size="sm" variant="boxed" className="!h-12 !w-12 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">
                      #{topPerformer.jerseyNumber} {topPerformer.name}
                    </p>
                    <p className="text-xs text-muted mt-0.5">Index {topPerformer.value.toFixed(1)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted">No data yet.</p>
              )}
            </SnapshotCard>

            <SnapshotCard icon="↑" label="Most Improved" tone="positive">
              {mostImproved ? (
                <>
                  <p className="text-2xl font-bold text-positive">{formatChange(mostImproved.value)}</p>
                  <p className="text-sm text-foreground mt-1 truncate">
                    #{mostImproved.jerseyNumber} {mostImproved.name}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted">No data yet.</p>
              )}
            </SnapshotCard>

            <SnapshotCard icon="◎" label="Needs Attention" tone="negative">
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
