import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import {
  getPlayerStatEntries,
  performanceIndexForEntries,
  recentTrendForEntries,
  getPlayerToiSummary,
  getPlayerPlusMinusSummary,
} from "@/lib/player-analytics";
import { getPlayerSituationTotals } from "@/lib/game-situations-server";
import { count as situationCount } from "@/lib/game-situations";
import { sumTrackedStatLines, trackedZoneEntryPct, trackedZoneExitPct, formatPct, formatChange, formatPlusMinus } from "@/lib/stats";
import { formatIceTime } from "@/lib/situation-stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { PlayerCompareSelector } from "@/components/players/PlayerCompareSelector";
import { cn } from "@/lib/cn";

async function buildPlayerSummary(playerId: string) {
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return null;
  const entries = await getPlayerStatEntries(playerId);
  // "Did Not Track" aware — a field never tracked this season is null
  // (rendered as "—") rather than a misleading 0 (see lib/stats.ts).
  const { sums, trackedGames } = sumTrackedStatLines(entries);
  const trackedOrNull = (k: keyof typeof sums) => (trackedGames[k] > 0 ? sums[k] : null);
  const totals = {
    zoneEntryPct: trackedZoneEntryPct(entries),
    zoneExitPct: trackedZoneExitPct(entries),
    shotAttempts: trackedOrNull("shotAttempts"),
    shots: trackedOrNull("shots"),
    giveaways: trackedOrNull("giveaways"),
    disruptions: trackedOrNull("disruptions"),
    hits: trackedOrNull("hits"),
    blocks: trackedOrNull("blocks"),
  };
  const index = performanceIndexForEntries(entries, player.position);
  const trend = recentTrendForEntries(entries, player.position);
  const toi = await getPlayerToiSummary(playerId);
  const plusMinus = player.position !== "GOALIE" ? await getPlayerPlusMinusSummary(playerId) : null;
  // 5-on-5 + Power Play + Penalty Kill combined — the real season Goals/
  // Points, not just the 5-on-5 line (see Row definitions below).
  const { totals: situationTotals } = await getPlayerSituationTotals(playerId);
  const allSituationGoals = situationCount(situationTotals, "ALL", "goals").value ?? 0;
  const allSituationAssists = situationCount(situationTotals, "ALL", "assists").value ?? 0;
  return { player, totals, index, trend, toi, plusMinus, allSituationGoals, allSituationAssists };
}

type Row = {
  label: string;
  format: (s: NonNullable<Awaited<ReturnType<typeof buildPlayerSummary>>>) => number | null;
  isPct?: boolean;
  isTime?: boolean;
  isSigned?: boolean;
  lowerIsBetter?: boolean;
};

const ROWS: Row[] = [
  { label: "Performance Index", format: (s) => s.index?.score ?? null },
  { label: "Recent Trend (%)", format: (s) => s.trend },
  { label: "Zone Entry %", format: (s) => s.totals.zoneEntryPct, isPct: true },
  { label: "Zone Exit %", format: (s) => s.totals.zoneExitPct, isPct: true },
  { label: "Shot Attempts", format: (s) => s.totals.shotAttempts },
  // 5-on-5 + Power Play + Penalty Kill combined — see allSituationGoals/
  // allSituationAssists in buildPlayerSummary above.
  { label: "Points", format: (s) => s.allSituationGoals + s.allSituationAssists },
  { label: "Shots", format: (s) => s.totals.shots },
  { label: "Goals", format: (s) => s.allSituationGoals },
  { label: "Giveaways", format: (s) => s.totals.giveaways, lowerIsBetter: true },
  { label: "Disruptions", format: (s) => s.totals.disruptions },
  { label: "Hits", format: (s) => s.totals.hits },
  { label: "Blocks", format: (s) => s.totals.blocks },
  { label: "Total TOI", format: (s) => s.toi.seasonTotalSeconds, isTime: true },
  { label: "Avg TOI / Game", format: (s) => s.toi.averagePerGameSeconds, isTime: true },
  { label: "5-on-5 TOI", format: (s) => s.toi.seasonEvenSeconds, isTime: true },
  // null for goalies — Plus/Minus is skaters only, never assigned a value for a goalie.
  { label: "Plus/Minus (Season)", format: (s) => s.plusMinus?.seasonTotal ?? null, isSigned: true },
  { label: "Avg Plus/Minus / Game", format: (s) => s.plusMinus?.averagePerGame ?? null, isSigned: true },
];

export default async function ComparePlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div>
        <PageHeader title="Compare Players" />
        <EmptyState title="No season yet" description="Set up your season and team first." />
      </div>
    );
  }

  const players = await prisma.player.findMany({
    where: { seasonId: season.id },
    orderBy: { jerseyNumber: "asc" },
    select: { id: true, firstName: true, lastName: true, jerseyNumber: true },
  });
  const selectorPlayers = players.map((p) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, jerseyNumber: p.jerseyNumber }));

  const [summaryA, summaryB] = await Promise.all([
    a ? buildPlayerSummary(a) : null,
    b ? buildPlayerSummary(b) : null,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Compare Players" subtitle={`Season ${season.name}`} />
      <PlayerCompareSelector players={selectorPlayers} />

      {!summaryA || !summaryB ? (
        <EmptyState title="Select two players" description="Choose a player in each dropdown above to compare." />
      ) : (
        <Card padded={false}>
          <div className="grid grid-cols-3 border-b border-border">
            <div className="p-4 text-sm text-muted">Metric</div>
            <div className="p-4 font-semibold text-foreground text-center">
              #{summaryA.player.jerseyNumber} {summaryA.player.firstName} {summaryA.player.lastName}
            </div>
            <div className="p-4 font-semibold text-foreground text-center">
              #{summaryB.player.jerseyNumber} {summaryB.player.firstName} {summaryB.player.lastName}
            </div>
          </div>
          {ROWS.map((row) => {
            const valA = row.format(summaryA);
            const valB = row.format(summaryB);
            const aWins =
              valA !== null && valB !== null && valA !== valB
                ? row.lowerIsBetter
                  ? valA < valB
                  : valA > valB
                : null;
            const bWins =
              valA !== null && valB !== null && valA !== valB
                ? row.lowerIsBetter
                  ? valB < valA
                  : valB > valA
                : null;
            return (
              <div key={row.label} className="grid grid-cols-3 border-b border-border last:border-b-0">
                <div className="p-4 text-sm text-muted">{row.label}</div>
                <div className={cn("p-4 text-center font-medium", aWins && "text-positive")}>
                  {row.isPct
                    ? formatPct(valA)
                    : row.isTime
                      ? valA !== null
                        ? formatIceTime(valA)
                        : "—"
                      : row.isSigned
                        ? valA !== null
                          ? formatPlusMinus(Math.round(valA * 100) / 100)
                          : "—"
                        : row.label.includes("Trend")
                          ? formatChange(valA)
                          : (valA ?? "—")}
                </div>
                <div className={cn("p-4 text-center font-medium", bWins && "text-positive")}>
                  {row.isPct
                    ? formatPct(valB)
                    : row.isTime
                      ? valB !== null
                        ? formatIceTime(valB)
                        : "—"
                      : row.isSigned
                        ? valB !== null
                          ? formatPlusMinus(Math.round(valB * 100) / 100)
                          : "—"
                        : row.label.includes("Trend")
                          ? formatChange(valB)
                          : (valB ?? "—")}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
