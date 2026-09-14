// Weekly Performance Rankings — Top 3 / Bottom 3 performers of the week.
//
// Reuses the existing Performance Index (lib/performance-index.ts) as the
// scoring system rather than inventing a new one: it's already a weighted,
// 0-100 composite covering the full stat profile per position, with
// positive stats contributing positively and negative stats (giveaways)
// pulling the score down. This module's job is purely to window that score
// by calendar week, rank players against each other, and persist a frozen
// historical record once a week has ended.
//
// "Current week" is always computed live, on read, straight from
// PracticePlayerStat/GamePlayerStat — there is no stored/cached "current
// week" row, so editing a stat mid-week is reflected the next time anything
// asks for the current week's rankings. A week only becomes a permanent,
// unchanging WeeklyRanking row once archiveCompletedWeeksForSeason() runs
// (via the Sunday-night cron) and that week has fully ended.

import { prisma } from "@/lib/db";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { getSeasonStatEntriesByPlayer, type StatEntry } from "@/lib/player-analytics";
import { calculatePerformanceIndex, type PerformanceIndexBreakdown } from "@/lib/performance-index";
import { sumStatLines, zoneEntryPct, zoneExitPct, points, savePct, type RawStatLine } from "@/lib/stats";
import { WEEKLY_RANKING_TIMEZONE, MIN_WEEKLY_ENTRIES_FOR_RANKING, WEEKLY_SCORING_VERSION } from "@/lib/weekly-rankings-config";
import { Prisma } from "@/app/generated/prisma/client";
import type { WeeklyRankCategory } from "@/app/generated/prisma/enums";

type Position = "FORWARD" | "DEFENSE" | "GOALIE";

export interface WeeklyBreakdownLine {
  label: string;
  detail: string;
}

export interface WeeklyCandidate {
  playerId: string;
  name: string;
  jerseyNumber: number;
  position: Position;
  performanceScore: number;
  entriesCount: number;
  statsSnapshot: RawStatLine;
  breakdown: WeeklyBreakdownLine[];
}

export interface InsufficientDataPlayer {
  playerId: string;
  name: string;
  jerseyNumber: number;
  entriesCount: number;
}

export interface WeeklyRankingResult {
  seasonId: string;
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
  top: WeeklyCandidate[];
  bottom: WeeklyCandidate[];
  insufficientData: InsufficientDataPlayer[];
  minEntriesRequired: number;
  scoringVersion: string;
}

// ---------------------------------------------------------------------------
// Week boundaries
// ---------------------------------------------------------------------------

/** Monday 00:00:00.000 through Sunday 23:59:59.999, in WEEKLY_RANKING_TIMEZONE, for the week containing `date`. */
export function getWeekBounds(date: Date, timeZone: string = WEEKLY_RANKING_TIMEZONE): { weekStart: Date; weekEnd: Date } {
  const zoned = toZonedTime(date, timeZone);
  const zonedStart = startOfWeek(zoned, { weekStartsOn: 1 });
  const zonedEnd = endOfWeek(zoned, { weekStartsOn: 1 });
  return {
    weekStart: fromZonedTime(zonedStart, timeZone),
    weekEnd: fromZonedTime(zonedEnd, timeZone),
  };
}

function nextWeekStart(weekStart: Date, timeZone: string = WEEKLY_RANKING_TIMEZONE): Date {
  const zoned = toZonedTime(weekStart, timeZone);
  return fromZonedTime(addWeeks(zoned, 1), timeZone);
}

/** 1-based week number within the season, for display (e.g. "Week 4"). Week 1 is the calendar week of the season's first logged practice/game. */
function weekNumberFor(weekStart: Date, seasonFirstWeekStart: Date, timeZone: string = WEEKLY_RANKING_TIMEZONE): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  // Compare zoned wall-clock instants so DST transitions never round to the wrong week.
  const a = toZonedTime(weekStart, timeZone).getTime();
  const b = toZonedTime(seasonFirstWeekStart, timeZone).getTime();
  return Math.round((a - b) / msPerWeek) + 1;
}

// ---------------------------------------------------------------------------
// Scoring breakdown -> human-readable lines
// ---------------------------------------------------------------------------

function describeComponent(label: string, totals: RawStatLine): string | null {
  switch (label) {
    case "Zone Entry %": {
      const pct = zoneEntryPct(totals);
      return pct === null ? null : `${pct.toFixed(0)}% zone entries (${totals.successfulZoneEntries}/${totals.zoneEntries})`;
    }
    case "Zone Exit %": {
      const pct = zoneExitPct(totals);
      return pct === null ? null : `${pct.toFixed(0)}% zone exits (${totals.successfulZoneExits}/${totals.zoneExits})`;
    }
    case "Points / Game":
      return `${points(totals)} points (${totals.goals}G, ${totals.assists}A)`;
    case "Scoring Chances / Game":
      return `${totals.scoringChances} scoring chances`;
    case "Takeaway − Giveaway / Game":
      return `${totals.takeaways} takeaways, ${totals.giveaways} giveaways`;
    case "Physical Play / Game":
      return `${totals.hits} hits, ${totals.blocks} blocks`;
    case "Save %": {
      const pct = savePct(totals);
      return pct === null ? null : `${pct.toFixed(1)}% save pct (${totals.saves}/${totals.shotsAgainst})`;
    }
    default:
      return null;
  }
}

/** Top contributing components (by weighted contribution), translated into human stat lines. Only the components that actually moved the score are shown — "the most important contributors," per spec. */
function buildBreakdown(index: PerformanceIndexBreakdown, totals: RawStatLine, maxLines = 3): WeeklyBreakdownLine[] {
  return index.components
    .slice()
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, maxLines)
    .map((c) => {
      const detail = describeComponent(c.label, totals);
      return detail ? { label: c.label, detail } : null;
    })
    .filter((l): l is WeeklyBreakdownLine => l !== null);
}

// ---------------------------------------------------------------------------
// Ranking + deterministic tie-breaking
// ---------------------------------------------------------------------------

function primaryStatValue(c: { position: Position; statsSnapshot: RawStatLine }): number {
  return c.position === "GOALIE" ? savePct(c.statsSnapshot) ?? 0 : points(c.statsSnapshot);
}

function positiveContributionCount(index: PerformanceIndexBreakdown): number {
  return index.components.filter((c) => c.scaledValue > 0).length;
}

/**
 * Deterministic best-to-worst ordering. Ties break, in order: (1) Performance
 * Score, (2) number of statistical categories the player contributed
 * positively to, (3) the primary counting stat for their position (points
 * for skaters, save % for goalies), (4) jersey number, as a stable
 * last-resort so rankings never shuffle randomly between runs.
 */
function compareCandidates(
  a: WeeklyCandidate & { _index: PerformanceIndexBreakdown },
  b: WeeklyCandidate & { _index: PerformanceIndexBreakdown }
): number {
  if (b.performanceScore !== a.performanceScore) return b.performanceScore - a.performanceScore;
  const posA = positiveContributionCount(a._index);
  const posB = positiveContributionCount(b._index);
  if (posB !== posA) return posB - posA;
  const primaryA = primaryStatValue(a);
  const primaryB = primaryStatValue(b);
  if (primaryB !== primaryA) return primaryB - primaryA;
  return a.jerseyNumber - b.jerseyNumber;
}

/**
 * Worst-to-best ordering for building the Bottom list. Deliberately NOT
 * `compareCandidates` reversed: reversing a best-to-worst list also flips
 * which side of a tie comes first, so the jersey-number tiebreak would end
 * up backwards for Bottom vs Top. Every comparison here is inverted except
 * the final tiebreak, which stays ascending-by-jersey in both directions —
 * ties break the same way regardless of which list they land in.
 */
function compareCandidatesWorstFirst(
  a: WeeklyCandidate & { _index: PerformanceIndexBreakdown },
  b: WeeklyCandidate & { _index: PerformanceIndexBreakdown }
): number {
  if (a.performanceScore !== b.performanceScore) return a.performanceScore - b.performanceScore;
  const posA = positiveContributionCount(a._index);
  const posB = positiveContributionCount(b._index);
  if (posA !== posB) return posA - posB;
  const primaryA = primaryStatValue(a);
  const primaryB = primaryStatValue(b);
  if (primaryA !== primaryB) return primaryA - primaryB;
  return a.jerseyNumber - b.jerseyNumber;
}

// ---------------------------------------------------------------------------
// Core computation for one (season, week) window
// ---------------------------------------------------------------------------

interface PlayerLite {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: Position;
}

function computeWindow(
  players: PlayerLite[],
  entriesByPlayer: Map<string, StatEntry[]>,
  weekStart: Date,
  weekEnd: Date,
  weekNumber: number,
  seasonId: string
): WeeklyRankingResult {
  const candidates: (WeeklyCandidate & { _index: PerformanceIndexBreakdown })[] = [];
  const insufficientData: InsufficientDataPlayer[] = [];

  for (const p of players) {
    const weekEntries = (entriesByPlayer.get(p.id) ?? []).filter((e) => e.date >= weekStart && e.date <= weekEnd);
    if (weekEntries.length === 0) continue; // nothing logged this week — not ranked, not "insufficient" either

    const name = `${p.firstName} ${p.lastName}`;
    if (weekEntries.length < MIN_WEEKLY_ENTRIES_FOR_RANKING) {
      insufficientData.push({ playerId: p.id, name, jerseyNumber: p.jerseyNumber, entriesCount: weekEntries.length });
      continue;
    }

    const totals = sumStatLines(weekEntries.map((e) => e.stat));
    const index = calculatePerformanceIndex(p.position, totals, weekEntries.length);
    candidates.push({
      playerId: p.id,
      name,
      jerseyNumber: p.jerseyNumber,
      position: p.position,
      performanceScore: index.score,
      entriesCount: weekEntries.length,
      statsSnapshot: totals,
      breakdown: buildBreakdown(index, totals),
      _index: index,
    });
  }

  const sorted = candidates.slice().sort(compareCandidates);
  const top = sorted.slice(0, 3);
  const topIds = new Set(top.map((c) => c.playerId));
  const bottom = candidates
    .slice()
    .sort(compareCandidatesWorstFirst)
    .filter((c) => !topIds.has(c.playerId))
    .slice(0, 3);

  const strip = (c: WeeklyCandidate & { _index: PerformanceIndexBreakdown }): WeeklyCandidate => {
    const { _index, ...rest } = c;
    void _index;
    return rest;
  };

  return {
    seasonId,
    weekStart,
    weekEnd,
    weekNumber,
    top: top.map(strip),
    bottom: bottom.map(strip),
    insufficientData,
    minEntriesRequired: MIN_WEEKLY_ENTRIES_FOR_RANKING,
    scoringVersion: WEEKLY_SCORING_VERSION,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Live current-week rankings — recomputed from scratch on every call, so a stat edit is reflected immediately. Never persisted. */
export async function getCurrentWeekRankings(seasonId: string): Promise<WeeklyRankingResult | null> {
  const players = await prisma.player.findMany({ where: { seasonId } });
  const entriesByPlayer = await getSeasonStatEntriesByPlayer(seasonId);

  const firstWeekStart = await getSeasonFirstWeekStart(seasonId, entriesByPlayer);
  if (!firstWeekStart) return null;

  const { weekStart, weekEnd } = getWeekBounds(new Date());
  const weekNumber = weekNumberFor(weekStart, firstWeekStart);
  return computeWindow(players, entriesByPlayer, weekStart, weekEnd, weekNumber, seasonId);
}

async function getSeasonFirstWeekStart(seasonId: string, entriesByPlayer: Map<string, StatEntry[]>): Promise<Date | null> {
  let earliest: Date | null = null;
  for (const entries of entriesByPlayer.values()) {
    for (const e of entries) {
      if (!earliest || e.date < earliest) earliest = e.date;
    }
  }
  if (earliest) return getWeekBounds(earliest).weekStart;

  // No stats logged yet at all — fall back to the season's creation date so a
  // week number is still defined once the first stat eventually gets logged.
  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  return season ? getWeekBounds(season.createdAt).weekStart : null;
}

/**
 * Archives every fully-completed week for a season that doesn't already have
 * a WeeklyRanking row, from the season's first logged week up to (but not
 * including) the current in-progress week. Safe to call repeatedly — already
 * archived weeks are skipped — so a missed or delayed cron run just catches
 * up on its next invocation instead of losing a week.
 */
export async function archiveCompletedWeeksForSeason(seasonId: string): Promise<{ archived: WeeklyRankingResult[] }> {
  const players = await prisma.player.findMany({ where: { seasonId } });
  const entriesByPlayer = await getSeasonStatEntriesByPlayer(seasonId);

  const firstWeekStart = await getSeasonFirstWeekStart(seasonId, entriesByPlayer);
  if (!firstWeekStart) return { archived: [] };

  const { weekStart: currentWeekStart } = getWeekBounds(new Date());

  const archived: WeeklyRankingResult[] = [];
  let cursor = firstWeekStart;
  let weekNumber = 1;

  while (cursor.getTime() < currentWeekStart.getTime()) {
    const alreadyArchived = await prisma.weeklyRanking.findUnique({
      where: { seasonId_weekStart: { seasonId, weekStart: cursor } },
    });

    if (!alreadyArchived) {
      const { weekEnd } = getWeekBounds(cursor);
      const result = computeWindow(players, entriesByPlayer, cursor, weekEnd, weekNumber, seasonId);
      await persistWeeklyRanking(result);
      archived.push(result);
    }

    cursor = nextWeekStart(cursor);
    weekNumber += 1;
  }

  return { archived };
}

async function persistWeeklyRanking(result: WeeklyRankingResult): Promise<void> {
  await prisma.weeklyRanking.create({
    data: {
      seasonId: result.seasonId,
      weekStart: result.weekStart,
      weekEnd: result.weekEnd,
      weekNumber: result.weekNumber,
      scoringVersion: result.scoringVersion,
      minEntriesRequired: result.minEntriesRequired,
      entries: {
        create: [
          ...result.top.map((c, i) => entryCreateData(c, "TOP", i + 1)),
          ...result.bottom.map((c, i) => entryCreateData(c, "BOTTOM", i + 1)),
        ],
      },
    },
  });
}

function entryCreateData(c: WeeklyCandidate, category: WeeklyRankCategory, rank: number) {
  return {
    playerId: c.playerId,
    category,
    rank,
    performanceScore: c.performanceScore,
    entriesCount: c.entriesCount,
    statsSnapshot: c.statsSnapshot as unknown as Prisma.InputJsonValue,
    breakdown: c.breakdown as unknown as Prisma.InputJsonValue,
  };
}

export interface ArchivedWeekSummary {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
  top: (WeeklyCandidate & { rank: number })[];
  bottom: (WeeklyCandidate & { rank: number })[];
}

/** All archived weeks for a season, most recent first, with their frozen Top 3 / Bottom 3. */
export async function listWeeklyHistory(seasonId: string): Promise<ArchivedWeekSummary[]> {
  const rankings = await prisma.weeklyRanking.findMany({
    where: { seasonId },
    orderBy: { weekStart: "desc" },
    include: { entries: { include: { player: true }, orderBy: { rank: "asc" } } },
  });

  return rankings.map((r) => {
    const toCandidate = (e: (typeof r.entries)[number]): WeeklyCandidate & { rank: number } => ({
      playerId: e.playerId,
      name: `${e.player.firstName} ${e.player.lastName}`,
      jerseyNumber: e.player.jerseyNumber,
      position: e.player.position,
      performanceScore: e.performanceScore,
      entriesCount: e.entriesCount,
      statsSnapshot: e.statsSnapshot as unknown as RawStatLine,
      breakdown: e.breakdown as unknown as WeeklyBreakdownLine[],
      rank: e.rank,
    });

    return {
      id: r.id,
      weekStart: r.weekStart,
      weekEnd: r.weekEnd,
      weekNumber: r.weekNumber,
      top: r.entries.filter((e) => e.category === "TOP").map(toCandidate),
      bottom: r.entries.filter((e) => e.category === "BOTTOM").map(toCandidate),
    };
  });
}
