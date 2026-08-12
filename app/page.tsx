import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { metricValue, change } from "@/lib/team-analytics";
import { getTeamStatEntries } from "@/lib/team-analytics-server";
import { buildRankings, buildWeeklyPerformers } from "@/lib/rankings";
import { formatChange } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge, TrendBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";

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

  const [nextGame, lastGame, nextPractice, team] = await Promise.all([
    prisma.game.findFirst({ where: { seasonId: season.id, date: { gte: now } }, orderBy: { date: "asc" } }),
    prisma.game.findFirst({
      where: { seasonId: season.id, isCompleted: true, date: { lte: now } },
      orderBy: { date: "desc" },
    }),
    prisma.practice.findFirst({ where: { seasonId: season.id, date: { gte: now } }, orderBy: { date: "asc" } }),
    prisma.team.findUnique({ where: { seasonId: season.id } }),
  ]);

  const teamEntries = await getTeamStatEntries(season.id);
  const last5 = teamEntries.slice(-5);
  const entryTrend = change(metricValue(last5, "zoneEntryPct", true), metricValue(teamEntries, "zoneEntryPct", true));
  const exitTrend = change(metricValue(last5, "zoneExitPct", true), metricValue(teamEntries, "zoneExitPct", true));
  const teamTrend =
    entryTrend !== null && exitTrend !== null ? (entryTrend + exitTrend) / 2 : entryTrend ?? exitTrend;

  const rankings = await buildRankings(season.id);
  const weeklyPerformers = await buildWeeklyPerformers(season.id);
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
        {/* Game context: next + last, compact side-by-side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="!p-5">
            <CardTitle className="!mb-1.5">Next Game</CardTitle>
            {nextGame ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {nextGame.homeAway === "HOME" ? "vs" : "@"} {nextGame.opponent}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{format(nextGame.date, "EEE, MMM d")}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge tone="accent">In {Math.max(differenceInCalendarDays(nextGame.date, now), 0)}d</Badge>
                  <Link href={`/games/${nextGame.id}`} className="block text-xs text-accent-strong hover:underline mt-1.5">
                    View →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">No upcoming game scheduled.</p>
            )}
          </Card>

          <Card className="!p-5">
            <CardTitle className="!mb-1.5">Last Game</CardTitle>
            {lastGame ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {lastGame.homeAway === "HOME" ? "vs" : "@"} {lastGame.opponent}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{format(lastGame.date, "MMM d")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="font-mono text-lg text-foreground">
                    {lastGame.ourScore}-{lastGame.opponentScore}
                  </p>
                  {lastGameResult && (
                    <Badge tone={lastGameResult === "W" ? "positive" : lastGameResult === "L" ? "negative" : "neutral"}>
                      {lastGameResult}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">No games completed yet.</p>
            )}
          </Card>
        </div>

        {/* Performance snapshot */}
        <div>
          <h2 className="text-sm font-medium text-muted mb-2.5">Performance Snapshot</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="!p-5">
              <CardTitle className="!mb-1.5">Team Trend</CardTitle>
              <TrendBadge value={teamTrend} />
              <p className="text-xs text-muted mt-1.5">Zone entry/exit, last 5 vs. season</p>
            </Card>
            <Card className="!p-5">
              <CardTitle className="!mb-1.5">Top Performer</CardTitle>
              {topPerformer ? (
                <>
                  <p className="font-medium text-foreground text-sm">
                    #{topPerformer.jerseyNumber} {topPerformer.name}
                  </p>
                  <p className="text-xs text-muted mt-1">Index {topPerformer.value.toFixed(1)}</p>
                </>
              ) : (
                <p className="text-sm text-muted">No data yet.</p>
              )}
            </Card>
            <Card className="!p-5">
              <CardTitle className="!mb-1.5">Most Improved</CardTitle>
              {mostImproved ? (
                <>
                  <p className="font-medium text-foreground text-sm">
                    #{mostImproved.jerseyNumber} {mostImproved.name}
                  </p>
                  <p className="text-xs text-positive mt-1">{formatChange(mostImproved.value)}</p>
                </>
              ) : (
                <p className="text-sm text-muted">No data yet.</p>
              )}
            </Card>
            <Card className="!p-5">
              <CardTitle className="!mb-1.5">Needs Attention</CardTitle>
              {needsAttention ? (
                <>
                  <p className="font-medium text-foreground text-sm">
                    #{needsAttention.jerseyNumber} {needsAttention.name}
                  </p>
                  <p className="text-xs text-muted mt-1">Index {needsAttention.value.toFixed(1)}</p>
                </>
              ) : (
                <p className="text-sm text-muted">No data yet.</p>
              )}
            </Card>
          </div>
        </div>

        {/* Upcoming + recent activity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="!p-5">
            <CardTitle className="!mb-1.5">Next Practice</CardTitle>
            {nextPractice ? (
              <Link href={`/practices/${nextPractice.id}`} className="text-sm text-foreground hover:text-accent-strong">
                Practice {nextPractice.number} — {format(nextPractice.date, "MMM d, yyyy")}
              </Link>
            ) : (
              <p className="text-sm text-muted">None scheduled</p>
            )}
          </Card>

          <Card className="!p-5">
            <CardTitle className="!mb-1.5">Weekly Performers</CardTitle>
            {weeklyPerformers.top.length === 0 ? (
              <p className="text-sm text-muted">No practice or game stats logged yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-positive mb-1">Top 3</p>
                  <ul className="space-y-1">
                    {weeklyPerformers.top.map((p) => (
                      <li key={p.playerId} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-foreground truncate">
                          #{p.jerseyNumber} {p.name}
                        </span>
                        <span className="text-xs text-muted-2 shrink-0">{p.value.toFixed(1)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-negative mb-1">Bottom 3</p>
                  <ul className="space-y-1">
                    {weeklyPerformers.bottom.map((p) => (
                      <li key={p.playerId} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-foreground truncate">
                          #{p.jerseyNumber} {p.name}
                        </span>
                        <span className="text-xs text-muted-2 shrink-0">{p.value.toFixed(1)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardHero>
  );
}
