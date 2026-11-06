// Official Game statistics ONLY. This module (and everything downstream of
// it — rankings, weekly rankings, team analytics, the Player Profile's
// "Official Game Stats" section) reads exclusively from GamePlayerStat.
// Mini Game statistics are a completely separate system — see
// lib/mini-game-analytics.ts — and are never read, merged, summed, or
// averaged in here. Keep it that way: do not add MiniGamePlayerStat to any
// query in this file.

import { prisma } from "@/lib/db";
import { RawStatLine, sumStatLines, change, topStatContributions, type StatContribution } from "@/lib/stats";
import { calculatePerformanceIndex, PerformanceIndexBreakdown } from "@/lib/performance-index";

export type StatSource = "GAME";

export interface StatEntry {
  id: string;
  playerId: string;
  date: Date;
  source: StatSource;
  label: string; // e.g. "vs Ice Hawks"
  stat: RawStatLine;
}

/** Bulk-loads every official-game stat line for a season, grouped by player, in chronological order. Avoids N+1 queries when computing stats for a whole roster at once (player list, rankings, dashboard). */
export async function getSeasonStatEntriesByPlayer(seasonId: string): Promise<Map<string, StatEntry[]>> {
  const gameStats = await prisma.gamePlayerStat.findMany({
    where: { game: { seasonId } },
    include: { game: true },
  });

  const byPlayer = new Map<string, StatEntry[]>();

  for (const s of gameStats) {
    const entry: StatEntry = {
      id: s.id,
      playerId: s.playerId,
      date: s.game.date,
      source: "GAME",
      label: `vs ${s.game.opponent}`,
      stat: s,
    };
    byPlayer.set(s.playerId, [...(byPlayer.get(s.playerId) ?? []), entry]);
  }

  for (const entries of byPlayer.values()) {
    entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  return byPlayer;
}

export async function getPlayerStatEntries(playerId: string): Promise<StatEntry[]> {
  const gameStats = await prisma.gamePlayerStat.findMany({ where: { playerId }, include: { game: true } });

  const entries: StatEntry[] = gameStats.map((s) => ({
    id: s.id,
    playerId: s.playerId,
    date: s.game.date,
    source: "GAME" as const,
    label: `vs ${s.game.opponent}`,
    stat: s,
  }));

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
  const [gameStats, situationStats] = await Promise.all([
    prisma.gamePlayerStat.findMany({ where: { playerId }, include: { game: true } }),
    prisma.gameSituationStat.findMany({ where: { playerId } }),
  ]);

  const situationByGame = new Map<string, { POWER_PLAY?: number; PENALTY_KILL?: number }>();
  for (const s of situationStats) {
    const entry = situationByGame.get(s.gameId) ?? {};
    entry[s.situation] = s.timeOnIceSeconds;
    situationByGame.set(s.gameId, entry);
  }

  const games: GameToiRow[] = gameStats
    .map((g) => {
      const sit = situationByGame.get(g.gameId) ?? {};
      const evenSeconds = g.timeOnIceSeconds;
      const powerPlaySeconds = sit.POWER_PLAY ?? 0;
      const penaltyKillSeconds = sit.PENALTY_KILL ?? 0;
      return {
        gameId: g.gameId,
        date: g.game.date,
        label: `vs ${g.game.opponent}`,
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
