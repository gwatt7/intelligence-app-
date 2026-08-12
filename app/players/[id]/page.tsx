import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getPlayerStatEntries, performanceIndexForEntries, recentTrendForEntries } from "@/lib/player-analytics";
import { sumStatLines, zoneEntryPct, zoneExitPct } from "@/lib/stats";
import { derivedCategories } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, TrendBadge } from "@/components/ui/Badge";
import { StatCategoryCard } from "@/components/stats/StatCategoryCard";
import { PerformanceIndexCard } from "@/components/stats/PerformanceIndexCard";
import { TrendChart, type TrendPoint } from "@/components/charts/TrendChart";
import { Card, CardTitle } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { HistoricalSeasonStatsCard } from "@/components/stats/HistoricalSeasonStatsCard";

const POSITION_LABEL = { FORWARD: "Forward", DEFENSE: "Defense", GOALIE: "Goalie" } as const;

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) notFound();

  const [season, seasonStat] = await Promise.all([
    prisma.season.findUnique({ where: { id: player.seasonId } }),
    prisma.playerSeasonStat.findUnique({ where: { playerId_seasonId: { playerId: id, seasonId: player.seasonId } } }),
  ]);

  const entries = await getPlayerStatEntries(id);
  const totals = sumStatLines(entries.map((e) => e.stat));
  const index = performanceIndexForEntries(entries, player.position);
  const trend = recentTrendForEntries(entries, player.position);

  const entryPctSeries: TrendPoint[] = entries.map((e) => ({
    label: e.label,
    value: zoneEntryPct(e.stat),
  }));
  const exitPctSeries: TrendPoint[] = entries.map((e) => ({
    label: e.label,
    value: zoneExitPct(e.stat),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${player.firstName} ${player.lastName}`}
        subtitle={`#${player.jerseyNumber} · ${POSITION_LABEL[player.position]}${player.shoots ? ` · Shoots ${player.shoots === "LEFT" ? "Left" : "Right"}` : ""}`}
        actions={
          <>
            <StatusBadge status={player.status} />
            <ButtonLink href="/team" variant="ghost">Edit in Roster</ButtonLink>
          </>
        }
      />

      {seasonStat && (
        <HistoricalSeasonStatsCard
          stat={seasonStat}
          isGoalie={player.position === "GOALIE"}
          seasonName={season?.name ?? "Season"}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PerformanceIndexCard breakdown={index} />
        <Card>
          <CardTitle>Recent Trend</CardTitle>
          <div className="mt-1">
            <TrendBadge value={trend} />
          </div>
          <p className="text-xs text-muted mt-2">
            Change vs. season average heading into the most recent practice or game.
          </p>
        </Card>
        <Card>
          <CardTitle>Sample Size</CardTitle>
          <p className="text-3xl font-bold text-foreground">{entries.length}</p>
          <p className="text-xs text-muted mt-1">Practices + games logged this season</p>
        </Card>
      </div>

      {entries.length > 0 ? (
        <>
          <StatCategoryCard title="Transition" items={derivedCategories.transition} stat={totals} />
          <StatCategoryCard title="Offense" items={derivedCategories.offense} stat={totals} />
          <StatCategoryCard title="Defense" items={derivedCategories.defense} stat={totals} />
          {player.position === "GOALIE" && (
            <StatCategoryCard title="Goaltending" items={derivedCategories.goaltending} stat={totals} />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardTitle>Zone Entry % Over Time</CardTitle>
              <TrendChart data={entryPctSeries} unit="%" />
            </Card>
            <Card>
              <CardTitle>Zone Exit % Over Time</CardTitle>
              <TrendChart data={exitPctSeries} unit="%" color="#f3f3ee" />
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <p className="text-sm text-muted">
            No practices or games logged for {player.firstName} yet this season. Category breakdowns and trend
            charts will appear here once stats are entered.
          </p>
        </Card>
      )}
    </div>
  );
}
