import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { metricValue, change } from "@/lib/team-analytics";
import { getTeamStatEntries } from "@/lib/team-analytics-server";
import { buildRankings } from "@/lib/rankings";
import { formatChange } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge, TrendBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import Link from "next/link";
import { format, formatDistanceToNow, differenceInCalendarDays } from "date-fns";

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

  const [nextGame, lastGame, nextPractice, activities, team] = await Promise.all([
    prisma.game.findFirst({ where: { seasonId: season.id, date: { gte: now } }, orderBy: { date: "asc" } }),
    prisma.game.findFirst({
      where: { seasonId: season.id, isCompleted: true, date: { lte: now } },
      orderBy: { date: "desc" },
    }),
    prisma.practice.findFirst({ where: { seasonId: season.id, date: { gte: now } }, orderBy: { date: "asc" } }),
    prisma.activity.findMany({ where: { seasonId: season.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.team.findUnique({ where: { seasonId: season.id } }),
  ]);

  const teamEntries = await getTeamStatEntries(season.id);
  const last5 = teamEntries.slice(-5);
  const entryTrend = change(metricValue(last5, "zoneEntryPct", true), metricValue(teamEntries, "zoneEntryPct", true));
  const exitTrend = change(metricValue(last5, "zoneExitPct", true), metricValue(teamEntries, "zoneExitPct", true));
  const teamTrend =
    entryTrend !== null && exitTrend !== null ? (entryTrend + exitTrend) / 2 : entryTrend ?? exitTrend;

  const rankings = await buildRankings(season.id);
  const topPerformer = rankings.topPerformanceIndex[0];
  const mostImproved = rankings.mostImproved[0];
  const needsAttention = [...rankings.topPerformanceIndex].sort((a, b) => a.value - b.value)[0];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle={`${team?.name ?? "Team"} · Season ${season.name}`} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardTitle>Next Game</CardTitle>
          {nextGame ? (
            <div>
              <p className="text-lg font-semibold text-foreground">
                {nextGame.homeAway === "HOME" ? "vs" : "@"} {nextGame.opponent}
              </p>
              <p className="text-sm text-muted mt-1">{format(nextGame.date, "EEEE, MMMM d, yyyy")}</p>
              {nextGame.location && <p className="text-sm text-muted">{nextGame.location}</p>}
              <Badge tone="accent" className="mt-2">
                In {Math.max(differenceInCalendarDays(nextGame.date, now), 0)} day(s)
              </Badge>
              <div className="mt-3">
                <Link href={`/games/${nextGame.id}`} className="text-sm text-accent-strong hover:underline">
                  View Game →
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">No upcoming game scheduled.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Last Game</CardTitle>
          {lastGame ? (
            (() => {
              const result =
                lastGame.ourScore !== null && lastGame.opponentScore !== null
                  ? lastGame.ourScore > lastGame.opponentScore
                    ? "W"
                    : lastGame.ourScore < lastGame.opponentScore
                    ? "L"
                    : "T"
                  : null;
              return (
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {lastGame.homeAway === "HOME" ? "vs" : "@"} {lastGame.opponent}
                  </p>
                  <p className="text-sm text-muted mt-1">{format(lastGame.date, "MMMM d, yyyy")}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-lg font-mono">
                      {lastGame.ourScore} - {lastGame.opponentScore}
                    </p>
                    {result && (
                      <Badge tone={result === "W" ? "positive" : result === "L" ? "negative" : "neutral"}>
                        {result === "W" ? "Win" : result === "L" ? "Loss" : "Tie"}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <p className="text-sm text-muted">No games completed yet.</p>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-medium text-muted mb-3">Performance Snapshot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardTitle>Team Trend</CardTitle>
            <TrendBadge value={teamTrend} />
            <p className="text-xs text-muted mt-2">Zone entry/exit, last 5 vs. season</p>
          </Card>
          <Card>
            <CardTitle>Top Performer</CardTitle>
            {topPerformer ? (
              <>
                <p className="font-medium text-foreground">
                  #{topPerformer.jerseyNumber} {topPerformer.name}
                </p>
                <p className="text-xs text-muted mt-1">Index {topPerformer.value.toFixed(1)}</p>
              </>
            ) : (
              <p className="text-sm text-muted">No data yet.</p>
            )}
          </Card>
          <Card>
            <CardTitle>Most Improved</CardTitle>
            {mostImproved ? (
              <>
                <p className="font-medium text-foreground">
                  #{mostImproved.jerseyNumber} {mostImproved.name}
                </p>
                <p className="text-xs text-positive mt-1">{formatChange(mostImproved.value)}</p>
              </>
            ) : (
              <p className="text-sm text-muted">No data yet.</p>
            )}
          </Card>
          <Card>
            <CardTitle>Needs Attention</CardTitle>
            {needsAttention ? (
              <>
                <p className="font-medium text-foreground">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardTitle>Upcoming</CardTitle>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted">Next Practice</p>
              {nextPractice ? (
                <Link href={`/practices/${nextPractice.id}`} className="text-foreground hover:text-accent-strong">
                  Practice {nextPractice.number} — {format(nextPractice.date, "MMM d, yyyy")}
                </Link>
              ) : (
                <p className="text-muted">None scheduled</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted">Next Game</p>
              {nextGame ? (
                <Link href={`/games/${nextGame.id}`} className="text-foreground hover:text-accent-strong">
                  {nextGame.homeAway === "HOME" ? "vs" : "@"} {nextGame.opponent} — {format(nextGame.date, "MMM d, yyyy")}
                </Link>
              ) : (
                <p className="text-muted">None scheduled</p>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>Recent Activity</CardTitle>
          {activities.length === 0 ? (
            <p className="text-sm text-muted">Nothing logged yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {activities.map((a) => (
                <li key={a.id} className="flex justify-between gap-3">
                  <span className="text-foreground">{a.message}</span>
                  <span className="text-xs text-muted-2 whitespace-nowrap">
                    {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
