import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { getPlayerStatEntries, performanceIndexForEntries, recentTrendForEntries } from "@/lib/player-analytics";
import { getPlayerMiniGameEntries, miniGameStatProgression, miniGameWeeklyTrend } from "@/lib/mini-game-analytics";
import { sumStatLines, zoneEntryPct, zoneExitPct, points } from "@/lib/stats";
import { derivedCategories } from "@/lib/stats";
import { TrendBadge } from "@/components/ui/Badge";
import { StatCategoryCard } from "@/components/stats/StatCategoryCard";
import { PerformanceIndexCard } from "@/components/stats/PerformanceIndexCard";
import { MiniGameProgressionCard } from "@/components/mini-games/MiniGameProgressionCard";
import { PlayerMiniGameStatForm } from "@/components/forms/PlayerMiniGameStatForm";
import { PlayerProfileHero } from "@/components/players/PlayerProfileHero";
import { TrendChart, type TrendPoint } from "@/components/charts/TrendChart";
import { Card, CardTitle } from "@/components/ui/Card";
import { HistoricalSeasonStatsCard } from "@/components/stats/HistoricalSeasonStatsCard";
import { format } from "date-fns";
import type { RawStatLine } from "@/lib/stats";

const MINI_GAME_OFFENSE_ITEMS = [
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "shots", label: "Shots" },
  { key: "scoringChances", label: "Scoring Chances" },
] as const;

const MINI_GAME_DEFENSE_ITEMS = [
  { key: "takeaways", label: "Takeaways" },
  { key: "giveaways", label: "Giveaways" },
  { key: "hits", label: "Hits" },
  { key: "blocks", label: "Blocks" },
] as const;

// Forwards only.
const MINI_GAME_FACEOFF_ITEMS = [{ key: "faceoffsWon", label: "Faceoffs Won" }] as const;

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await prisma.player.findUnique({ where: { id } });
  if (!player) notFound();

  const [season, seasonStat] = await Promise.all([
    prisma.season.findUnique({ where: { id: player.seasonId } }),
    prisma.playerSeasonStat.findUnique({ where: { playerId_seasonId: { playerId: id, seasonId: player.seasonId } } }),
  ]);

  // --- Official Game stats (GamePlayerStat only — see lib/player-analytics.ts) ---
  const entries = await getPlayerStatEntries(id);
  const totals = sumStatLines(entries.map((e) => e.stat));
  const index = performanceIndexForEntries(entries, player.position);
  const trend = recentTrendForEntries(entries, player.position);

  const entryPctSeries: TrendPoint[] = entries.map((e) => ({ label: e.label, value: zoneEntryPct(e.stat) }));
  const exitPctSeries: TrendPoint[] = entries.map((e) => ({ label: e.label, value: zoneExitPct(e.stat) }));

  // --- Mini Game stats (MiniGamePlayerStat only — see lib/mini-game-analytics.ts) ---
  const miniGameEntries = await getPlayerMiniGameEntries(id);
  const miniGameTotals = sumStatLines(miniGameEntries.map((e) => e.stat));
  const miniGameProgression = miniGameStatProgression(miniGameEntries);
  const miniGameWeekly = miniGameWeeklyTrend(miniGameEntries);

  const seasonMiniGames = await prisma.miniGame.findMany({
    where: { seasonId: player.seasonId },
    orderBy: { date: "desc" },
  });
  const miniGameOptions = seasonMiniGames.map((mg) => ({ id: mg.id, label: format(mg.date, "MMM d, yyyy") }));
  const statsByMiniGame: Record<string, RawStatLine> = Object.fromEntries(
    miniGameEntries.map((e) => [e.miniGameId, e.stat])
  );

  return (
    <div className="space-y-6">
      <PlayerProfileHero player={player} />

      {seasonStat && (
        <HistoricalSeasonStatsCard
          stat={seasonStat}
          isGoalie={player.position === "GOALIE"}
          seasonName={season?.name ?? "Season"}
        />
      )}

      {/* =================================================================
          OFFICIAL GAME STATS — reads only GamePlayerStat. Never combined
          with Mini Game data below.
          ================================================================= */}
      <div>
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Official Game Stats</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PerformanceIndexCard breakdown={index} />
            <Card>
              <CardTitle>Recent Trend</CardTitle>
              <div className="mt-1">
                <TrendBadge value={trend} />
              </div>
              <p className="text-xs text-muted mt-2">Change vs. season average heading into the most recent official game.</p>
            </Card>
            <Card>
              <CardTitle>Sample Size</CardTitle>
              <p className="text-3xl font-bold text-foreground">{entries.length}</p>
              <p className="text-xs text-muted mt-1">Official games logged this season</p>
            </Card>
          </div>

          {entries.length > 0 ? (
            <>
              <StatCategoryCard title="Transition" items={derivedCategories.transition} stat={totals} />
              <StatCategoryCard title="Offense" items={derivedCategories.offense} stat={totals} />
              <StatCategoryCard title="Defense" items={derivedCategories.defense} stat={totals} />
              {player.position === "FORWARD" && (
                <StatCategoryCard title="Faceoffs" items={derivedCategories.faceoffs} stat={totals} />
              )}
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
                No official games logged for {player.firstName} yet this season. Category breakdowns and trend
                charts will appear here once stats are entered.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* =================================================================
          MINI GAME STATS — reads only MiniGamePlayerStat. Completely
          separate system: never combined with Official Game stats above.
          ================================================================= */}
      <div>
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">Mini Game Stats</h2>
        <div className="space-y-4">
          <Card>
            <CardTitle>Log / Edit {player.firstName}&apos;s Mini Game Stats</CardTitle>
            <PlayerMiniGameStatForm
              playerId={player.id}
              isGoalie={player.position === "GOALIE"}
              isForward={player.position === "FORWARD"}
              miniGames={miniGameOptions}
              statsByMiniGame={statsByMiniGame}
            />
          </Card>

          {miniGameEntries.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">
                No Mini Games logged for {player.firstName} yet. Totals, progression, and weekly trend will appear
                here once stats are entered above (or from the Mini Games tab).
              </p>
            </Card>
          ) : (
            <>
            <Card>
              <CardTitle>Mini Game Sample Size</CardTitle>
              <p className="text-3xl font-bold text-foreground">{miniGameEntries.length}</p>
              <p className="text-xs text-muted mt-1">Mini Games logged this season</p>
            </Card>

            <StatCategoryCard title="Mini Game Totals — Offense" items={derivedCategories.offense} stat={miniGameTotals} />
            <StatCategoryCard title="Mini Game Totals — Defense" items={derivedCategories.defense} stat={miniGameTotals} />
            {player.position === "FORWARD" && (
              <StatCategoryCard title="Mini Game Totals — Faceoffs" items={derivedCategories.faceoffs} stat={miniGameTotals} />
            )}

            <MiniGameProgressionCard
              title="Mini Game Progression (vs. previous Mini Game)"
              items={MINI_GAME_OFFENSE_ITEMS}
              progression={miniGameProgression}
            />
            <MiniGameProgressionCard
              title="Mini Game Progression — Defense (vs. previous Mini Game)"
              items={MINI_GAME_DEFENSE_ITEMS}
              progression={miniGameProgression}
            />
            {player.position === "FORWARD" && (
              <MiniGameProgressionCard
                title="Mini Game Progression — Faceoffs (vs. previous Mini Game)"
                items={MINI_GAME_FACEOFF_ITEMS}
                progression={miniGameProgression}
              />
            )}

            <div>
              <MiniGameProgressionCard
                title="Mini Game Weekly Trend"
                items={MINI_GAME_OFFENSE_ITEMS}
                progression={miniGameWeekly?.progression ?? null}
              />
              {miniGameWeekly && (
                <p className="text-xs text-muted-2 mt-1.5">
                  This week ({format(miniGameWeekly.weekStart, "MMM d")}–{format(miniGameWeekly.weekEnd, "MMM d")}) vs.
                  last week · {miniGameWeekly.currentWeekCount} Mini Game(s) this week, {miniGameWeekly.previousWeekCount}{" "}
                  last week
                </p>
              )}
            </div>

            <Card>
              <CardTitle>Mini Game History</CardTitle>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted uppercase tracking-wide text-left">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Goals</th>
                      <th className="py-2 pr-4">Assists</th>
                      <th className="py-2 pr-4">Points</th>
                      <th className="py-2 pr-4">Shots</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...miniGameEntries].reverse().map((e) => (
                      <tr key={e.id} className="border-t border-border">
                        <td className="py-2 pr-4 text-muted">{e.label}</td>
                        <td className="py-2 pr-4">{e.stat.goals}</td>
                        <td className="py-2 pr-4">{e.stat.assists}</td>
                        <td className="py-2 pr-4">{points(e.stat)}</td>
                        <td className="py-2 pr-4">{e.stat.shots}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
