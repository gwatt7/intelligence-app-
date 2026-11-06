// Loads the original recorded lines and builds game-situation totals (see
// lib/game-situations.ts). Read-only; nothing is cached or stored, so every
// page load reflects the latest saved, edited or deleted stats.

import { prisma } from "@/lib/db";
import { addLine, emptyTotals, type SituationTotals, type SpecialTeamsGame } from "@/lib/game-situations";
import { getPlayerAvailabilityExclusions, isPlayedGame } from "@/lib/player-availability";

export interface AnalyticsGame {
  id: string;
  date: Date;
  opponent: string;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  ourScore: number | null;
  opponentScore: number | null;
  isCompleted: boolean;
  /** Team totals for this game, by situation (sum of every player's lines). */
  totals: SituationTotals;
  special: SpecialTeamsGame;
  /** Any stats, result or special-teams numbers recorded for this game. */
  hasData: boolean;
}

/** Every game in the season with its team totals by situation, oldest first. */
export async function getSeasonAnalyticsGames(seasonId: string): Promise<AnalyticsGame[]> {
  const [games, evenRows, situationRows] = await Promise.all([
    prisma.game.findMany({ where: { seasonId }, orderBy: { date: "asc" } }),
    prisma.gamePlayerStat.findMany({ where: { game: { seasonId } } }),
    prisma.gameSituationStat.findMany({ where: { game: { seasonId } } }),
  ]);

  const byGame = new Map(
    games.map((g) => [
      g.id,
      {
        totals: emptyTotals(),
        ppGoals: 0,
        rows: 0,
      },
    ])
  );
  for (const r of evenRows) {
    const g = byGame.get(r.gameId);
    if (!g) continue;
    addLine(g.totals, "EVEN", r);
    g.rows++;
  }
  for (const r of situationRows) {
    const g = byGame.get(r.gameId);
    if (!g) continue;
    addLine(g.totals, r.situation, r);
    if (r.situation === "POWER_PLAY") g.ppGoals += r.goals;
    g.rows++;
  }

  return games.map((g) => {
    const agg = byGame.get(g.id)!;
    const special: SpecialTeamsGame = {
      powerPlayOpportunities: g.powerPlayOpportunities,
      penaltyKillOpportunities: g.penaltyKillOpportunities,
      powerPlayGoalsAgainst: g.powerPlayGoalsAgainst,
      powerPlayGoals: agg.ppGoals,
    };
    return {
      id: g.id,
      date: g.date,
      opponent: g.opponent,
      homeAway: g.homeAway,
      ourScore: g.ourScore,
      opponentScore: g.opponentScore,
      isCompleted: g.isCompleted,
      totals: agg.totals,
      special,
      hasData:
        agg.rows > 0 || g.isCompleted || g.powerPlayOpportunities !== null || g.penaltyKillOpportunities !== null || g.powerPlayGoalsAgainst !== null,
    };
  });
}

/**
 * One player's totals by situation across their official games, plus how
 * many games count toward their games-played. Availability-aware: a game
 * the player was Scratched/Injured for contributes nothing here, even if a
 * stray stat row somehow exists for it (shouldn't happen — status governs
 * read-time inclusion, never deletes the underlying row). A Dressed game
 * that's actually been played counts toward `games` even with no recorded
 * line at all (see isPlayedGame in lib/player-availability.ts).
 */
export async function getPlayerSituationTotals(playerId: string): Promise<{ totals: SituationTotals; games: number }> {
  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { seasonId: true } });
  if (!player) return { totals: emptyTotals(), games: 0 };

  const [seasonGames, allSeasonGameStats, evenRows, situationRows, exclusions] = await Promise.all([
    prisma.game.findMany({ where: { seasonId: player.seasonId }, select: { id: true, isCompleted: true } }),
    prisma.gamePlayerStat.findMany({ where: { game: { seasonId: player.seasonId } }, select: { gameId: true } }),
    prisma.gamePlayerStat.findMany({ where: { playerId } }),
    prisma.gameSituationStat.findMany({ where: { playerId } }),
    getPlayerAvailabilityExclusions(playerId),
  ]);

  const gameIdsWithStats = new Set(allSeasonGameStats.map((s) => s.gameId));
  const playedGameIds = new Set(
    seasonGames.filter((g) => isPlayedGame(g, gameIdsWithStats) && !exclusions.has(g.id)).map((g) => g.id)
  );

  const totals = emptyTotals();
  const games = new Set<string>();
  for (const r of evenRows) {
    if (!playedGameIds.has(r.gameId)) continue;
    addLine(totals, "EVEN", r);
    games.add(r.gameId);
  }
  for (const r of situationRows) {
    if (!playedGameIds.has(r.gameId)) continue;
    addLine(totals, r.situation, r);
    games.add(r.gameId);
  }
  // A dressed, played game with no recorded line at all still counts toward games-played.
  for (const id of playedGameIds) games.add(id);
  return { totals, games: games.size };
}
