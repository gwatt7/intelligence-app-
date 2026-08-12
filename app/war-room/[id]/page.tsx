import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import { Badge, TrendBadge } from "@/components/ui/Badge";
import { MissionBriefForm } from "@/components/war-room/MissionBriefForm";
import { AfterActionForm } from "@/components/war-room/AfterActionForm";
import { sumStatLines, formatPct, EMPTY_STAT_LINE } from "@/lib/stats";
import { metricValue, change } from "@/lib/team-analytics";
import { getTeamStatEntries } from "@/lib/team-analytics-server";
import type { ObjectiveDraft } from "@/lib/actions/war-room";

export default async function WarRoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const game = await prisma.game.findUnique({
    where: { id },
    include: {
      playerStats: true,
      warRoom: { include: { objectives: { orderBy: { order: "asc" } }, highlights: true } },
    },
  });
  if (!game) notFound();

  const players = await prisma.player.findMany({
    where: { seasonId: game.seasonId },
    orderBy: { jerseyNumber: "asc" },
  });
  const selectorPlayers = players.map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, jerseyNumber: p.jerseyNumber }));

  const teamTotals = sumStatLines(game.playerStats.length > 0 ? game.playerStats : [EMPTY_STAT_LINE]);

  const objectiveDrafts: ObjectiveDraft[] = (game.warRoom?.objectives ?? []).map((o) => ({
    text: o.text,
    metric: o.metric,
    comparator: o.comparator,
    target: o.target,
  }));

  const highlightsMap: Record<string, string> = {};
  for (const h of game.warRoom?.highlights ?? []) highlightsMap[h.category] = h.playerId;

  const result =
    game.isCompleted && game.ourScore !== null && game.opponentScore !== null
      ? game.ourScore > game.opponentScore
        ? "W"
        : game.ourScore < game.opponentScore
        ? "L"
        : "T"
      : null;

  const teamEntries = await getTeamStatEntries(game.seasonId);
  const last5 = teamEntries.slice(-5);
  const ourTeamMetrics = [
    { key: "zoneEntryPct", label: "Zone Entry %", isPct: true },
    { key: "zoneExitPct", label: "Zone Exit %", isPct: true },
    { key: "giveaways", label: "Giveaways", isPct: false },
    { key: "scoringChances", label: "Scoring Chances", isPct: false },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`War Room — ${game.homeAway === "HOME" ? "vs" : "@"} ${game.opponent}`}
        subtitle={`${format(game.date, "MMMM d, yyyy")} · ${game.homeAway === "HOME" ? "Home" : "Away"}`}
        actions={game.isCompleted ? <Badge tone="accent">Game Completed</Badge> : <Badge tone="neutral">Upcoming</Badge>}
      />

      {game.isCompleted && (
        <Card>
          <CardTitle>Final Result</CardTitle>
          <div className="flex items-center gap-4">
            <p className="text-3xl font-bold text-foreground">
              {game.ourScore} - {game.opponentScore}
            </p>
            {result && (
              <Badge tone={result === "W" ? "positive" : result === "L" ? "negative" : "neutral"}>
                {result === "W" ? "Win" : result === "L" ? "Loss" : "Tie"}
              </Badge>
            )}
          </div>
        </Card>
      )}

      {!game.isCompleted && (
        <Card>
          <CardTitle>Our Team — Recent Trends (Last 5)</CardTitle>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ourTeamMetrics.map((m) => {
              const recent = metricValue(last5, m.key, m.isPct);
              const season = metricValue(teamEntries, m.key, m.isPct);
              const delta = change(recent, season);
              return (
                <div key={m.key}>
                  <p className="text-xs text-muted">{m.label}</p>
                  <p className="text-lg font-semibold text-foreground">
                    {m.isPct ? formatPct(recent) : recent?.toFixed(1) ?? "—"}
                  </p>
                  <TrendBadge value={delta} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Mission Brief</CardTitle>
        <MissionBriefForm
          gameId={game.id}
          defaults={{
            opponentStrengths: game.warRoom?.opponentStrengths ?? "",
            opponentWeaknesses: game.warRoom?.opponentWeaknesses ?? "",
            opponentHabits: game.warRoom?.opponentHabits ?? "",
            keysToVictory: game.warRoom?.keysToVictory ?? "",
            objectives: objectiveDrafts,
          }}
        />
      </Card>

      {game.isCompleted && (
        <Card>
          <CardTitle>After Action Report</CardTitle>
          <AfterActionForm
            gameId={game.id}
            teamTotals={teamTotals}
            objectives={(game.warRoom?.objectives ?? []).map((o) => ({
              id: o.id,
              text: o.text,
              metric: o.metric,
              comparator: o.comparator,
              target: o.target,
              manualStatus: o.manualStatus,
            }))}
            players={selectorPlayers}
            defaults={{
              whatWentWell: game.warRoom?.whatWentWell ?? "",
              whatWentWrong: game.warRoom?.whatWentWrong ?? "",
              lessonsLearned: game.warRoom?.lessonsLearned ?? "",
              changesToMake: game.warRoom?.changesToMake ?? "",
              keepDoing: game.warRoom?.keepDoing ?? "",
              highlights: highlightsMap,
            }}
          />
        </Card>
      )}
    </div>
  );
}
