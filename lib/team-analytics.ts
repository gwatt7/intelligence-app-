// Pure, client-safe analytics helpers — no Prisma import here. Client
// components (e.g. the time filter selector) import this module directly, so
// pulling in the database client here would leak server-only code (and
// Node built-ins) into the browser bundle. Data fetching lives in
// lib/team-analytics-server.ts instead.

import { RawStatLine, sumStatLines, getStatValue, change } from "@/lib/stats";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

export type StatSource = "PRACTICE" | "GAME";

export interface TeamStatEntry {
  id: string;
  date: Date;
  source: StatSource;
  label: string;
  stat: RawStatLine; // team totals for this one practice/game
}

export const TIME_FILTERS = [
  "LAST_PRACTICE",
  "LAST_5_PRACTICES",
  "THIS_WEEK",
  "LAST_5_GAMES",
  "THIS_MONTH",
  "SEASON",
] as const;
export type TimeFilter = (typeof TIME_FILTERS)[number];

export const TIME_FILTER_LABEL: Record<TimeFilter, string> = {
  LAST_PRACTICE: "Last Practice",
  LAST_5_PRACTICES: "Last 5 Practices",
  THIS_WEEK: "This Week",
  LAST_5_GAMES: "Last 5 Games",
  THIS_MONTH: "This Month",
  SEASON: "Season",
};

export function filterEntries(entries: TeamStatEntry[], filter: TimeFilter, now = new Date()): TeamStatEntry[] {
  switch (filter) {
    case "LAST_PRACTICE":
      return entries.filter((e) => e.source === "PRACTICE").slice(-1);
    case "LAST_5_PRACTICES":
      return entries.filter((e) => e.source === "PRACTICE").slice(-5);
    case "LAST_5_GAMES":
      return entries.filter((e) => e.source === "GAME").slice(-5);
    case "THIS_WEEK": {
      const interval = { start: startOfWeek(now), end: endOfWeek(now) };
      return entries.filter((e) => isWithinInterval(e.date, interval));
    }
    case "THIS_MONTH": {
      const interval = { start: startOfMonth(now), end: endOfMonth(now) };
      return entries.filter((e) => isWithinInterval(e.date, interval));
    }
    case "SEASON":
    default:
      return entries;
  }
}

export const TREND_METRICS = [
  { key: "zoneEntryPct", label: "Zone Entry %", isPct: true },
  { key: "zoneExitPct", label: "Zone Exit %", isPct: true },
  { key: "scoringChances", label: "Scoring Chances", isPct: false },
  { key: "goals", label: "Goals", isPct: false },
  { key: "shots", label: "Shots", isPct: false },
  { key: "takeaways", label: "Takeaways", isPct: false },
  { key: "giveaways", label: "Giveaways", isPct: false },
  { key: "disruptions", label: "Disruptions", isPct: false },
  { key: "hits", label: "Hits", isPct: false },
  { key: "blocks", label: "Blocks", isPct: false },
] as const;

/** Percentage metrics are derived from summed counts (never averaged). Count metrics are averaged per practice/game so periods of different lengths stay comparable. */
export function metricValue(entries: TeamStatEntry[], key: string, isPct: boolean): number | null {
  if (entries.length === 0) return null;
  const totals = sumStatLines(entries.map((e) => e.stat));
  if (isPct) return getStatValue(totals, key);
  const total = getStatValue(totals, key) ?? 0;
  return total / entries.length;
}

export { change };
