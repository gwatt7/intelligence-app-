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
// Ranked by a transparent COUNT of real per-stat improvements vs. declines
// between a player's most recent Mini Game and the one before it (tie-
// broken by capped magnitude, so one extreme percentage can't dominate the
// ranking) — not by points % alone. Points-only ranking structurally can
// never surface a defenseman's or goalie's real improvement, since they
// often have 0 points most games; counting every tracked stat's direction
// of change lets a goalie's save/goals-against swing, or a defenseman's
// hits/disruptions swing, count the same as a forward's scoring swing.
// Purely Mini Game data; players with fewer than 2 Mini Games logged aren't
// ranked (nothing to compare yet) — never a fabricated progression.

/** Stats where a numeric INCREASE is the real improvement. */
const POSITIVE_WHEN_UP: { key: keyof RawStatLine; label: string }[] = [
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "shots", label: "Shots" },
  { key: "scoringChances", label: "Scoring Chances" },
  { key: "successfulZoneEntries", label: "Successful Zone Entries" },
  { key: "successfulZoneExits", label: "Successful Zone Exits" },
  { key: "disruptions", label: "Disruptions" },
  { key: "hits", label: "Hits" },
  { key: "blocks", label: "Blocks" },
  { key: "faceoffsWon", label: "Faceoffs Won" },
  { key: "saves", label: "Saves" },
  { key: "kills", label: "Kills" },
  { key: "freezes", label: "Freezes" },
  { key: "wins", label: "Wins" },
];

/** Stats where a numeric DECREASE is the real improvement (fewer is
 * better) — this is what lets goaltending be interpreted correctly: fewer
 * goals against is a goaltending improvement, not a decline. */
const POSITIVE_WHEN_DOWN: { key: keyof RawStatLine; label: string }[] = [
  { key: "giveaways", label: "Giveaways" },
  { key: "goalsAgainst", label: "Goals Against" },
  { key: "losses", label: "Losses" },
];

export interface MiniGameStatChange {
  key: string;
  label: string;
  current: number;
  previous: number;
  progression: StatProgression;
}

/** Splits every stat whose value actually changed between two Mini Game
 * lines into "favorable" (a real improvement, direction-aware) and
 * "unfavorable" (a real decline) — flat/no-change stats appear in neither,
 * and a stat with no previous value is "new" (favorable for a
 * positive-when-up stat, unfavorable for a positive-when-down one) rather
 * than a fabricated percentage. Sorted by magnitude (capped at 200% so one
 * extreme swing can't bury every other real change) for display/tie-break
 * purposes only — never the primary ranking signal by itself. */
function classifyMiniGameChanges(
  current: RawStatLine,
  previous: RawStatLine
): { favorable: MiniGameStatChange[]; unfavorable: MiniGameStatChange[] } {
  const favorable: MiniGameStatChange[] = [];
  const unfavorable: MiniGameStatChange[] = [];

  for (const { key, label } of POSITIVE_WHEN_UP) {
    const progression = pctChange(current[key], previous[key]);
    const change: MiniGameStatChange = { key, label, current: current[key], previous: previous[key], progression };
    if (progression.type === "increase" || progression.type === "new") favorable.push(change);
    else if (progression.type === "decrease") unfavorable.push(change);
  }
  for (const { key, label } of POSITIVE_WHEN_DOWN) {
    const progression = pctChange(current[key], previous[key]);
    const change: MiniGameStatChange = { key, label, current: current[key], previous: previous[key], progression };
    if (progression.type === "decrease") favorable.push(change);
    else if (progression.type === "increase" || progression.type === "new") unfavorable.push(change);
  }

  const magnitude = (c: MiniGameStatChange) => (c.progression.pct !== null ? Math.min(Math.abs(c.progression.pct), 200) : 60);
  favorable.sort((a, b) => magnitude(b) - magnitude(a));
  unfavorable.sort((a, b) => magnitude(b) - magnitude(a));

  return { favorable, unfavorable };
}

const sumMagnitude = (changes: MiniGameStatChange[]) =>
  changes.reduce((total, c) => total + (c.progression.pct !== null ? Math.min(Math.abs(c.progression.pct), 200) : 60), 0);

/** Turns the top 1-3 real stat changes (already direction-classified by
 * classifyMiniGameChanges) into one concise, data-driven sentence — never a
 * generic or invented explanation. Returns "" when there's nothing to
 * describe (e.g. a player with no favorable changes shown on the Trending
 * Down card). */
export function describeMiniGameChanges(changes: MiniGameStatChange[], direction: "improved" | "declined"): string {
  if (changes.length === 0) return "";
  const labels = changes.slice(0, 3).map((c) => c.label);
  const joined =
    labels.length === 1
      ? labels[0]
      : labels.length === 2
      ? `${labels[0]} and ${labels[1]}`
      : `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
  const verb = labels.length === 1 ? "has" : "have";
  return `${joined} ${verb} ${direction} compared with the previous Mini Game.`;
}

export interface MiniGameProgressionSummary {
  playerId: string;
  name: string;
  jerseyNumber: number;
  photoUrl: string | null;
  position: "FORWARD" | "DEFENSE" | "GOALIE";
  currentPoints: number;
  previousPoints: number;
  /** Points (goals + assists) progression — shown as the small headline
   * badge only when it's a real, computable change (pctChange already
   * returns "none"/"new" correctly for zero-baseline cases); the detailed
   * favorable/unfavorable breakdown below is what actually explains the
   * ranking, and works regardless of position. */
  progression: StatProgression;
  favorableChanges: MiniGameStatChange[];
  unfavorableChanges: MiniGameStatChange[];
  /** e.g. "Oct 1, 2026 → Oct 8, 2026" — the two Mini Games being compared. */
  comparisonLabel: string;
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
    const currentEntry = entries[entries.length - 1];
    const previousEntry = entries[entries.length - 2];
    const current = currentEntry.stat;
    const previous = previousEntry.stat;
    const currentPoints = points(current);
    const previousPoints = points(previous);
    const { favorable, unfavorable } = classifyMiniGameChanges(current, previous);
    summaries.push({
      playerId: p.id,
      name: `${p.firstName} ${p.lastName}`,
      jerseyNumber: p.jerseyNumber,
      photoUrl: p.photoUrl,
      position: p.position,
      currentPoints,
      previousPoints,
      progression: pctChange(currentPoints, previousPoints),
      favorableChanges: favorable,
      unfavorableChanges: unfavorable,
      comparisonLabel: `${previousEntry.label} → ${currentEntry.label}`,
    });
  }

  // Primary sort: net count of real favorable vs. unfavorable stat changes
  // (simple, explainable, immune to any single stat's percentage). Tie-
  // break: total capped magnitude in the relevant direction — a secondary
  // influence only, so an extreme swing can break a tie but can never
  // outrank a player with more genuine all-around improvement.
  const netScore = (s: MiniGameProgressionSummary) => s.favorableChanges.length - s.unfavorableChanges.length;

  const topProgressing = summaries
    .filter((s) => netScore(s) > 0)
    .sort((a, b) => netScore(b) - netScore(a) || sumMagnitude(b.favorableChanges) - sumMagnitude(a.favorableChanges))
    .slice(0, 5);

  const trendingDown = summaries
    .filter((s) => netScore(s) < 0)
    .sort((a, b) => netScore(a) - netScore(b) || sumMagnitude(b.unfavorableChanges) - sumMagnitude(a.unfavorableChanges))
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
