// Player availability (Dressed / Scratched / Injured) — official Games
// only. Dressed is the default and has no stored row; only Scratched and
// Injured get a GamePlayerAvailability row (see that model's comment in
// schema.prisma). This module is the single source of truth every stats
// read path (lib/player-analytics.ts, lib/game-situations-server.ts,
// lib/overall-rankings-server.ts) filters through, so "which games count
// for this player" is never computed two different ways in two places.
//
// A Scratched/Injured game is fully excluded from that player's entries —
// never included as a zero-performance game. A Dressed game always counts,
// even with no GamePlayerStat row at all (see isPlayedGame below).

import { prisma } from "@/lib/db";

export type PlayerGameStatus = "DRESSED" | "SCRATCHED" | "INJURED";

/** Key for the lookup maps below. */
export function availabilityKey(playerId: string, gameId: string): string {
  return `${playerId}:${gameId}`;
}

/** Every explicit (non-Dressed) status in a season, keyed by `${playerId}:${gameId}`. Absence from this map means Dressed. */
export async function getSeasonAvailabilityExclusions(seasonId: string): Promise<Map<string, PlayerGameStatus>> {
  const rows = await prisma.gamePlayerAvailability.findMany({ where: { game: { seasonId } } });
  return new Map(rows.map((r) => [availabilityKey(r.playerId, r.gameId), r.status]));
}

/** One player's explicit (non-Dressed) statuses across the season, keyed by gameId. */
export async function getPlayerAvailabilityExclusions(playerId: string): Promise<Map<string, PlayerGameStatus>> {
  const rows = await prisma.gamePlayerAvailability.findMany({ where: { playerId } });
  return new Map(rows.map((r) => [r.gameId, r.status]));
}

/** Every explicit status for one game, keyed by playerId — for the roster status selector. */
export async function getGameAvailability(gameId: string): Promise<Map<string, PlayerGameStatus>> {
  const rows = await prisma.gamePlayerAvailability.findMany({ where: { gameId } });
  return new Map(rows.map((r) => [r.playerId, r.status]));
}

/**
 * A game "counts" toward games-played/averages for a dressed player with no
 * recorded stats only if the game has actually happened — `isCompleted`, or
 * it already has at least one real GamePlayerStat row for anyone (covers a
 * game whose final score hasn't been entered yet but clearly has data).
 * Without this check, every future scheduled game would inflate every
 * dressed player's games-played count just for not being marked unavailable.
 */
export function isPlayedGame(game: { isCompleted: boolean; id: string }, gameIdsWithAnyStats: Set<string>): boolean {
  return game.isCompleted || gameIdsWithAnyStats.has(game.id);
}

export interface PlayerAvailabilitySummary {
  gamesDressed: number;
  gamesScratched: number;
  gamesInjured: number;
  /** Every game on the season's schedule, played or not — a different, larger number than the three above, which only cover games that have actually happened. */
  gamesOnSchedule: number;
}

/** Separate from performance stats on purpose — see Northstar's "add a separate availability section" requirement. */
export async function getPlayerAvailabilitySummary(playerId: string): Promise<PlayerAvailabilitySummary> {
  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { seasonId: true } });
  if (!player) return { gamesDressed: 0, gamesScratched: 0, gamesInjured: 0, gamesOnSchedule: 0 };

  const [seasonGames, allSeasonGameStats, exclusions] = await Promise.all([
    prisma.game.findMany({ where: { seasonId: player.seasonId }, select: { id: true, isCompleted: true } }),
    prisma.gamePlayerStat.findMany({ where: { game: { seasonId: player.seasonId } }, select: { gameId: true } }),
    getPlayerAvailabilityExclusions(playerId),
  ]);

  const gameIdsWithStats = new Set(allSeasonGameStats.map((s) => s.gameId));
  const playedGames = seasonGames.filter((g) => isPlayedGame(g, gameIdsWithStats));

  let gamesScratched = 0;
  let gamesInjured = 0;
  for (const g of playedGames) {
    const status = exclusions.get(g.id);
    if (status === "SCRATCHED") gamesScratched++;
    else if (status === "INJURED") gamesInjured++;
  }

  return {
    gamesDressed: playedGames.length - gamesScratched - gamesInjured,
    gamesScratched,
    gamesInjured,
    gamesOnSchedule: seasonGames.length,
  };
}

export async function setPlayerGameStatus(gameId: string, playerId: string, status: PlayerGameStatus): Promise<void> {
  if (status === "DRESSED") {
    await prisma.gamePlayerAvailability.deleteMany({ where: { gameId, playerId } });
    return;
  }
  await prisma.gamePlayerAvailability.upsert({
    where: { gameId_playerId: { gameId, playerId } },
    create: { gameId, playerId, status },
    update: { status },
  });
}
