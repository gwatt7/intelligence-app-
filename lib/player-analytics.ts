// Official Game statistics ONLY. This module (and everything downstream of
// it — rankings, weekly rankings, team analytics, the Player Profile's
// "Official Game Stats" section) reads exclusively from GamePlayerStat.
// Mini Game statistics are a completely separate system — see
// lib/mini-game-analytics.ts — and are never read, merged, summed, or
// averaged in here. Keep it that way: do not add MiniGamePlayerStat to any
// query in this file.

import { prisma } from "@/lib/db";
import { RawStatLine, EMPTY_STAT_LINE, sumStatLines, change, topStatContributions, type StatContribution } from "@/lib/stats";
import { calculatePerformanceIndex, PerformanceIndexBreakdown } from "@/lib/performance-index";
import { getSeasonAvailabilityExclusions, getPlayerAvailabilityExclusions, isPlayedGame } from "@/lib/player-availability";

export type StatSource = "GAME";

export interface StatEntry {
  id: string;
  playerId: string;
  date: Date;
  source: StatSource;
  label: string; // e.g. "vs Ice Hawks"
  stat: RawStatLine;
}

/**
 * Bulk-loads every official-game stat line for a season, grouped by player,
 * in chronological order. Avoids N+1 queries when computing stats for a
 * whole roster at once (player list, rankings, dashboard).
 *
 * Availability-aware: a player Scratched or Injured for a game gets no
 * entry for it at all (never a zero-performance game). A Dressed player
 * (the default — see lib/player-availability.ts) gets an entry for every
 * game that's actually been played, using their real GamePlayerStat row if
 * one exists or an all-zero line if not — so "games played" always reflects
 * availability, never just whether a box score happened to be typed in.
 */
export async function getSeasonStatEntriesByPlayer(seasonId: string): Promise<Map<string, StatEntry[]>> {
  const [players, games, gameStats, exclusions] = await Promise.all([
    prisma.player.findMany({ where: { seasonId }, select: { id: true } }),
    prisma.game.findMany({ where: { seasonId }, select: { id: true, date: true, opponent: true, isCompleted: true } }),
    prisma.gamePlayerStat.findMany({ where: { game: { seasonId } } }),
    getSeasonAvailabilityExclusions(seasonId),
  ]);

  const gameIdsWithStats = new Set(gameStats.map((s) => s.gameId));
  const playedGames = games.filter((g) => isPlayedGame(g, gameIdsWithStats)).sort((a, b) => a.date.getTime() - b.date.getTime());
  const statByKey = new Map(gameStats.map((s) => [`${s.playerId}:${s.gameId}`, s]));

  const byPlayer = new Map<string, StatEntry[]>();
  for (const p of players) {
    const entries: StatEntry[] = [];
    for (const g of playedGames) {
      if (exclusions.has(`${p.id}:${g.id}`)) continue; // Scratched/Injured — fully excluded
      const row = statByKey.get(`${p.id}:${g.id}`);
      entries.push({
        id: row?.id ?? `dressed-${g.id}`,
        playerId: p.id,
        date: g.date,
        source: "GAME",
        label: `vs ${g.opponent}`,
        stat: row ?? EMPTY_STAT_LINE,
      });
    }
    if (entries.length > 0) byPlayer.set(p.id, entries);
  }

  return byPlayer;
}

export async function getPlayerStatEntries(playerId: string): Promise<StatEntry[]> {
  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { seasonId: true } });
  if (!player) return [];

  const [games, allSeasonGameStats, playerGameStats, exclusions] = await Promise.all([
    prisma.game.findMany({ where: { seasonId: player.seasonId }, select: { id: true, date: true, opponent: true, isCompleted: true } }),
    prisma.gamePlayerStat.findMany({ where: { game: { seasonId: player.seasonId } }, select: { gameId: true } }),
    prisma.gamePlayerStat.findMany({ where: { playerId } }),
    getPlayerAvailabilityExclusions(playerId),
  ]);

  const gameIdsWithStats = new Set(allSeasonGameStats.map((s) => s.gameId));
  const playedGames = games.filter((g) => isPlayedGame(g, gameIdsWithStats));
  const statByGameId = new Map(playerGameStats.map((s) => [s.gameId, s]));

  const entries: StatEntry[] = [];
  for (const g of playedGames) {
    if (exclusions.has(g.id)) continue; // Scratched/Injured — fully excluded
    const row = statByGameId.get(g.id);
    entries.push({
      id: row?.id ?? `dressed-${g.id}`,
      playerId,
      date: g.date,
      source: "GAME",
      label: `vs ${g.opponent}`,
      stat: row ?? EMPTY_STAT_LINE,
    });
  }

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  return entries;
}

export function performanceIndexForEntries(
  entries: StatEntry[],
  position: "FORWARD" | "DEFENSE" | "GOALIE"
): PerformanceIndexBreakdown | null {
  if (entries.length === 0) return null;
  const totals = sumStatLines(entries.map((e) => e.stat));
  return calculatePerformanceIndex(position, totals, entries.length);
}

/** Recent Trend = % change between the most recent entry's index and the season-to-date average index of everything before it. Returns null when there isn't enough history to compare yet. */
export function recentTrendForEntries(
  entries: StatEntry[],
  position: "FORWARD" | "DEFENSE" | "GOALIE"
): number | null {
  if (entries.length < 2) return null;
  const latest = entries[entries.length - 1];
  const prior = entries.slice(0, -1);

  const latestIndex = calculatePerformanceIndex(position, latest.stat, 1).score;
  const priorTotals = sumStatLines(prior.map((e) => e.stat));
  const priorIndex = calculatePerformanceIndex(position, priorTotals, prior.length).score;

  return change(latestIndex, priorIndex);
}

/** A single player's top 3 official-Game stat contributions (most recent game vs. the one before it) — the "why" behind the Games Top Performer card, using the same shared topStatContributions formula the Mini Games side uses (see lib/stats.ts), applied only to this player's own GamePlayerStat entries. Empty when the player has fewer than 2 official games logged; never a fabricated percentage. */
export async function getGameStatContributions(playerId: string): Promise<StatContribution[]> {
  const entries = await getPlayerStatEntries(playerId);
  if (entries.length < 2) return [];
  const current = entries[entries.length - 1].stat;
  const previous = entries[entries.length - 2].stat;
  return topStatContributions(current, previous);
}

// ---------------------------------------------------------------------------
// Time on Ice — official Games only, manually entered (5-on-5 on
// GamePlayerStat, Power Play / Penalty Kill on GameSituationStat — see
// lib/game-situations.ts for how the three are tracked and summed). No
// automated video-based shift detection exists in Northstar yet; every
// number here comes from a coach's own entry, nothing is estimated.

export interface GameToiRow {
  gameId: string;
  date: Date;
  label: string;
  evenSeconds: number;
  powerPlaySeconds: number;
  penaltyKillSeconds: number;
  totalSeconds: number;
}

export interface PlayerToiSummary {
  games: GameToiRow[];
  seasonEvenSeconds: number;
  seasonPowerPlaySeconds: number;
  seasonPenaltyKillSeconds: number;
  seasonTotalSeconds: number;
  /** null when the player has no official games logged yet. */
  averagePerGameSeconds: number | null;
}

export async function getPlayerToiSummary(playerId: string): Promise<PlayerToiSummary> {
  const player = await prisma.player.findUnique({ where: { id: playerId }, select: { seasonId: true } });
  if (!player) {
    return { games: [], seasonEvenSeconds: 0, seasonPowerPlaySeconds: 0, seasonPenaltyKillSeconds: 0, seasonTotalSeconds: 0, averagePerGameSeconds: null };
  }

  const [seasonGames, allSeasonGameStats, playerGameStats, situationStats, exclusions] = await Promise.all([
    prisma.game.findMany({ where: { seasonId: player.seasonId }, select: { id: true, date: true, opponent: true, isCompleted: true } }),
    prisma.gamePlayerStat.findMany({ where: { game: { seasonId: player.seasonId } }, select: { gameId: true } }),
    prisma.gamePlayerStat.findMany({ where: { playerId } }),
    prisma.gameSituationStat.findMany({ where: { playerId } }),
    getPlayerAvailabilityExclusions(playerId),
  ]);

  const gameIdsWithStats = new Set(allSeasonGameStats.map((s) => s.gameId));
  const playedGames = seasonGames.filter((g) => isPlayedGame(g, gameIdsWithStats) && !exclusions.has(g.id));

  const evenByGame = new Map(playerGameStats.map((s) => [s.gameId, s.timeOnIceSeconds]));
  const situationByGame = new Map<string, { POWER_PLAY?: number; PENALTY_KILL?: number }>();
  for (const s of situationStats) {
    const entry = situationByGame.get(s.gameId) ?? {};
    entry[s.situation] = s.timeOnIceSeconds;
    situationByGame.set(s.gameId, entry);
  }

  const games: GameToiRow[] = playedGames
    .map((g) => {
      const sit = situationByGame.get(g.id) ?? {};
      const evenSeconds = evenByGame.get(g.id) ?? 0;
      const powerPlaySeconds = sit.POWER_PLAY ?? 0;
      const penaltyKillSeconds = sit.PENALTY_KILL ?? 0;
      return {
        gameId: g.id,
        date: g.date,
        label: `vs ${g.opponent}`,
        evenSeconds,
        powerPlaySeconds,
        penaltyKillSeconds,
        totalSeconds: evenSeconds + powerPlaySeconds + penaltyKillSeconds,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const seasonEvenSeconds = games.reduce((a, g) => a + g.evenSeconds, 0);
  const seasonPowerPlaySeconds = games.reduce((a, g) => a + g.powerPlaySeconds, 0);
  const seasonPenaltyKillSeconds = games.reduce((a, g) => a + g.penaltyKillSeconds, 0);
  const seasonTotalSeconds = seasonEvenSeconds + seasonPowerPlaySeconds + seasonPenaltyKillSeconds;

  return {
    games,
    seasonEvenSeconds,
    seasonPowerPlaySeconds,
    seasonPenaltyKillSeconds,
    seasonTotalSeconds,
    averagePerGameSeconds: games.length ? Math.round(seasonTotalSeconds / games.length) : null,
  };
}
