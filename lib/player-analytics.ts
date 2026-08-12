import { prisma } from "@/lib/db";
import { RawStatLine, sumStatLines, change } from "@/lib/stats";
import { calculatePerformanceIndex, PerformanceIndexBreakdown } from "@/lib/performance-index";

export type StatSource = "PRACTICE" | "GAME";

export interface StatEntry {
  id: string;
  playerId: string;
  date: Date;
  source: StatSource;
  label: string; // e.g. "Practice 3" or "vs Ice Hawks"
  stat: RawStatLine;
}

/** Bulk-loads every practice + game stat line for a season, grouped by player, in chronological order. Avoids N+1 queries when computing stats for a whole roster at once (player list, rankings, dashboard). */
export async function getSeasonStatEntriesByPlayer(seasonId: string): Promise<Map<string, StatEntry[]>> {
  const [practiceStats, gameStats] = await Promise.all([
    prisma.practicePlayerStat.findMany({
      where: { practice: { seasonId } },
      include: { practice: true },
    }),
    prisma.gamePlayerStat.findMany({
      where: { game: { seasonId } },
      include: { game: true },
    }),
  ]);

  const byPlayer = new Map<string, StatEntry[]>();

  for (const s of practiceStats) {
    const entry: StatEntry = {
      id: s.id,
      playerId: s.playerId,
      date: s.practice.date,
      source: "PRACTICE",
      label: `Practice ${s.practice.number}`,
      stat: s,
    };
    byPlayer.set(s.playerId, [...(byPlayer.get(s.playerId) ?? []), entry]);
  }
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
  const [practiceStats, gameStats] = await Promise.all([
    prisma.practicePlayerStat.findMany({ where: { playerId }, include: { practice: true } }),
    prisma.gamePlayerStat.findMany({ where: { playerId }, include: { game: true } }),
  ]);

  const entries: StatEntry[] = [
    ...practiceStats.map((s) => ({
      id: s.id,
      playerId: s.playerId,
      date: s.practice.date,
      source: "PRACTICE" as const,
      label: `Practice ${s.practice.number}`,
      stat: s,
    })),
    ...gameStats.map((s) => ({
      id: s.id,
      playerId: s.playerId,
      date: s.game.date,
      source: "GAME" as const,
      label: `vs ${s.game.opponent}`,
      stat: s,
    })),
  ];

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
