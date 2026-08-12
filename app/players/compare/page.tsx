import { prisma } from "@/lib/db";
import { getCurrentSeason } from "@/lib/season";
import { getPlayerStatEntries, performanceIndexForEntries, recentTrendForEntries } from "@/lib/player-analytics";
import { sumStatLines, zoneEntryPct, zoneExitPct, points, formatPct, formatChange } from "@/lib/stats";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { PlayerCompareSelector } from "@/components/players/PlayerCompareSelector";
import { cn } from "@/lib/cn";

async function buildPlayerSummary(playerId: string) {
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return null;
  const entries = await getPlayerStatEntries(playerId);
  const totals = sumStatLines(entries.map((e) => e.stat));
  const index = performanceIndexForEntries(entries, player.position);
  const trend = recentTrendForEntries(entries, player.position);
  return { player, totals, index, trend };
}

type Row = {
  label: string;
  format: (s: NonNullable<Awaited<ReturnType<typeof buildPlayerSummary>>>) => number | null;
  isPct?: boolean;
  lowerIsBetter?: boolean;
};

const ROWS: Row[] = [
  { label: "Performance Index", format: (s) => s.index?.score ?? null },
  { label: "Recent Trend (%)", format: (s) => s.trend },
  { label: "Zone Entry %", format: (s) => zoneEntryPct(s.totals), isPct: true },
  { label: "Zone Exit %", format: (s) => zoneExitPct(s.totals), isPct: true },
  { label: "Scoring Chances", format: (s) => s.totals.scoringChances },
  { label: "Points", format: (s) => points(s.totals) },
  { label: "Shots", format: (s) => s.totals.shots },
  { label: "Goals", format: (s) => s.totals.goals },
  { label: "Takeaways", format: (s) => s.totals.takeaways },
  { label: "Giveaways", format: (s) => s.totals.giveaways, lowerIsBetter: true },
  { label: "Disruptions", format: (s) => s.totals.disruptions },
  { label: "Hits", format: (s) => s.totals.hits },
  { label: "Blocks", format: (s) => s.totals.blocks },
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
                  {row.isPct ? formatPct(valA) : row.label.includes("Trend") ? formatChange(valA) : valA ?? "—"}
                </div>
                <div className={cn("p-4 text-center font-medium", bWins && "text-positive")}>
                  {row.isPct ? formatPct(valB) : row.label.includes("Trend") ? formatChange(valB) : valB ?? "—"}
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
