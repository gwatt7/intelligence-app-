// Mini Game statistics ONLY. This is a deliberately separate, parallel
// system to lib/player-analytics.ts (Official Games) and
// lib/team-analytics-server.ts (Official Games) — it queries
// MiniGamePlayerStat exclusively and never reads GamePlayerStat, never sums
// or averages Mini Game numbers together with Official Game numbers, and
// never feeds into the Performance Index, Weekly (Official) Rankings, or
// Analytics page. If you're tempted to make this module call into
// lib/player-analytics.ts or vice versa: don't — that's the one thing this
// whole feature must never do.
//
// pctChange/topStatContributions are pure, data-agnostic math utilities
// shared with lib/player-analytics.ts (moved to lib/stats.ts for exactly
// that reason) — sharing the FORMULA is fine; no MiniGamePlayerStat row
// ever gets summed, averaged, or ranked together with a GamePlayerStat row.

import { prisma } from "@/lib/db";
import { format } from "date-fns";
import {
  EMPTY_STAT_LINE,
  sumStatLines,
  points,
  pctChange,
  topStatContributions,
  type RawStatLine,
  type StatProgression,
  type StatContribution,
} from "@/lib/stats";
import { getWeekBounds, previousWeekStart } from "@/lib/calendar-week";

export type { StatProgression, StatContribution };
export { pctChange, topStatContributions };

const STAT_KEYS = Object.keys(EMPTY_STAT_LINE) as (keyof RawStatLine)[];

export interface MiniGameStatEntry {
  id: string;
  miniGameId: string;
  playerId: string;
  date: Date;
  label: string;
  stat: RawStatLine;
}

/** Bulk-loads every Mini Game stat line for a season, grouped by player, in chronological order. */
export async function getSeasonMiniGameEntriesByPlayer(seasonId: string): Promise<Map<string, MiniGameStatEntry[]>> {
  const stats = await prisma.miniGamePlayerStat.findMany({
    where: { miniGame: { seasonId } },
    include: { miniGame: true },
  });

  const byPlayer = new Map<string, MiniGameStatEntry[]>();
  for (const s of stats) {
    const entry: MiniGameStatEntry = {
      id: s.id,
      miniGameId: s.miniGameId,
      playerId: s.playerId,
      date: s.miniGame.date,
      label: format(s.miniGame.date, "MMM d, yyyy"),
      stat: s,
    };
    byPlayer.set(s.playerId, [...(byPlayer.get(s.playerId) ?? []), entry]);
  }
  for (const entries of byPlayer.values()) {
    entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  return byPlayer;
}

export async function getPlayerMiniGameEntries(playerId: string): Promise<MiniGameStatEntry[]> {
  const stats = await prisma.miniGamePlayerStat.findMany({ where: { playerId }, include: { miniGame: true } });
  const entries: MiniGameStatEntry[] = stats.map((s) => ({
    id: s.id,
    miniGameId: s.miniGameId,
    playerId: s.playerId,
    date: s.miniGame.date,
    label: format(s.miniGame.date, "MMM d, yyyy"),
    stat: s,
  }));
  entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  return entries;
}

// ---------------------------------------------------------------------------
// Progression math
// ---------------------------------------------------------------------------

export function formatMiniGameChange(p: StatProgression, digits = 0): string {
  if (p.type === "new") return "New";
  const arrow = p.type === "increase" ? "↑" : p.type === "decrease" ? "↓" : "→";
  const sign = (p.pct ?? 0) > 0 ? "+" : "";
  return `${arrow} ${sign}${(p.pct ?? 0).toFixed(digits)}%`;
}

/**
 * Per-stat progression: the player's most recent Mini Game vs. the one
 * immediately before it. Returns null if the player has fewer than 2 Mini
 * Games logged — there's nothing to compare yet.
 */
export function miniGameStatProgression(entries: MiniGameStatEntry[]): Record<keyof RawStatLine, StatProgression> | null {
  if (entries.length < 2) return null;
  const current = entries[entries.length - 1].stat;
  const previous = entries[entries.length - 2].stat;
  const result = {} as Record<keyof RawStatLine, StatProgression>;
  for (const key of STAT_KEYS) {
    result[key] = pctChange(current[key], previous[key]);
  }
  return result;
}

export interface MiniGameWeeklyTrend {
  weekStart: Date;
  weekEnd: Date;
  currentWeekTotals: RawStatLine;
  previousWeekTotals: RawStatLine;
  currentWeekCount: number;
  previousWeekCount: number;
  progression: Record<keyof RawStatLine, StatProgression>;
}

/**
 * Weekly Mini Game trend: this calendar week's Mini Game totals vs. last
 * calendar week's, per stat — completely independent of the per-entry
 * progression above and of anything Official-Game-related. Returns null if
 * the player has no Mini Games logged at all.
 */
export function miniGameWeeklyTrend(entries: MiniGameStatEntry[], now = new Date()): MiniGameWeeklyTrend | null {
  if (entries.length === 0) return null;

  const { weekStart, weekEnd } = getWeekBounds(now);
  const prevStart = previousWeekStart(weekStart);
  const { weekEnd: prevEnd } = getWeekBounds(prevStart);

  const currentWeekEntries = entries.filter((e) => e.date >= weekStart && e.date <= weekEnd);
  const previousWeekEntries = entries.filter((e) => e.date >= prevStart && e.date <= prevEnd);

  const currentWeekTotals = sumStatLines(currentWeekEntries.map((e) => e.stat));
  const previousWeekTotals = sumStatLines(previousWeekEntries.map((e) => e.stat));

  const progression = {} as Record<keyof RawStatLine, StatProgression>;
  for (const key of STAT_KEYS) {
    progression[key] = pctChange(currentWeekTotals[key], previousWeekTotals[key]);
  }

  return {
    weekStart,
    weekEnd,
    currentWeekTotals,
    previousWeekTotals,
    currentWeekCount: currentWeekEntries.length,
    previousWeekCount: previousWeekEntries.length,
    progression,
  };
}

// ---------------------------------------------------------------------------
// Team overview — Top Progressing / Trending Down
// ---------------------------------------------------------------------------
// Ranked by % change in points (goals + assists) between a player's most
// recent Mini Game and the one before it — the same "current vs. previous"
// comparison as the per-stat progression above, just applied to the single
// most recognizable scoring stat so players can be ranked against each
// other. Purely Mini Game data; players with fewer than 2 Mini Games logged
// aren't ranked (nothing to compare yet).

export interface MiniGameProgressionSummary {
  playerId: string;
  name: string;
  jerseyNumber: number;
  photoUrl: string | null;
  currentPoints: number;
  previousPoints: number;
  progression: StatProgression;
}

export async function getMiniGameTeamOverview(
  seasonId: string
): Promise<{ topProgressing: MiniGameProgressionSummary[]; trendingDown: MiniGameProgressionSummary[] }> {
  const players = await prisma.player.findMany({ where: { seasonId } });
  const entriesByPlayer = await getSeasonMiniGameEntriesByPlayer(seasonId);

  const summaries: MiniGameProgressionSummary[] = [];
  for (const p of players) {
    const entries = entriesByPlayer.get(p.id) ?? [];
    if (entries.length < 2) continue;
    const current = entries[entries.length - 1].stat;
    const previous = entries[entries.length - 2].stat;
    const currentPoints = points(current);
    const previousPoints = points(previous);
    summaries.push({
      playerId: p.id,
      name: `${p.firstName} ${p.lastName}`,
      jerseyNumber: p.jerseyNumber,
      photoUrl: p.photoUrl,
      currentPoints,
      previousPoints,
      progression: pctChange(currentPoints, previousPoints),
    });
  }

  const sortValue = (s: MiniGameProgressionSummary) =>
    s.progression.type === "new" ? Number.POSITIVE_INFINITY : s.progression.pct ?? 0;

  const sorted = summaries.slice().sort((a, b) => sortValue(b) - sortValue(a));

  const topProgressing = sorted.filter((s) => sortValue(s) > 0).slice(0, 5);
  const trendingDown = sorted
    .filter((s) => sortValue(s) < 0)
    .sort((a, b) => sortValue(a) - sortValue(b))
    .slice(0, 5);

  return { topProgressing, trendingDown };
}

// ---------------------------------------------------------------------------
// Mini Games Top Performer — completely independent of the Official Games
// "Top Performer" in lib/rankings.ts (which is Performance-Index-based).
// Deliberately does NOT reuse calculatePerformanceIndex, per this module's
// standing rule of never feeding Mini Game data into "the Performance
// Index" — instead it ranks by total Mini Game points (goals + assists),
// the same real, already-displayed stat the Mini Game History table uses.
// ---------------------------------------------------------------------------

export interface MiniGameTopPerformer {
  playerId: string;
  name: string;
  jerseyNumber: number;
  photoUrl: string | null;
  totalPoints: number;
  miniGamesPlayed: number;
}

export async function getMiniGameTopPerformer(seasonId: string): Promise<MiniGameTopPerformer | null> {
  const players = await prisma.player.findMany({ where: { seasonId } });
  const entriesByPlayer = await getSeasonMiniGameEntriesByPlayer(seasonId);

  let best: MiniGameTopPerformer | null = null;
  for (const p of players) {
    const entries = entriesByPlayer.get(p.id) ?? [];
    if (entries.length === 0) continue;
    const totalPoints = points(sumStatLines(entries.map((e) => e.stat)));
    if (!best || totalPoints > best.totalPoints) {
      best = {
        playerId: p.id,
        name: `${p.firstName} ${p.lastName}`,
        jerseyNumber: p.jerseyNumber,
        photoUrl: p.photoUrl,
        totalPoints,
        miniGamesPlayed: entries.length,
      };
    }
  }
  return best;
}

/** A single player's top 3 Mini Game stat contributions (most recent Mini Game vs. the one before it) — the "why" behind the Mini Games Top Performer card. Empty when the player has fewer than 2 Mini Games logged; never a fabricated percentage. */
export async function getMiniGameStatContributions(playerId: string): Promise<StatContribution[]> {
  const entries = await getPlayerMiniGameEntries(playerId);
  if (entries.length < 2) return [];
  const current = entries[entries.length - 1].stat;
  const previous = entries[entries.length - 2].stat;
  return topStatContributions(current, previous);
}
