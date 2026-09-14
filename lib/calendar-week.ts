// Pure calendar-week math — Monday-Sunday weeks in a configurable IANA
// timezone, DST-safe. Deliberately has no knowledge of stats or their
// source (official game vs. mini game): it's shared by lib/weekly-rankings.ts
// (Official Games) and lib/mini-game-analytics.ts (Mini Games) purely for
// date arithmetic, never for stat data itself.

import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { startOfWeek, endOfWeek, addWeeks } from "date-fns";

export const DEFAULT_WEEK_TIMEZONE = "America/Chicago";

/** Monday 00:00:00.000 through Sunday 23:59:59.999, in `timeZone`, for the week containing `date`. */
export function getWeekBounds(date: Date, timeZone: string = DEFAULT_WEEK_TIMEZONE): { weekStart: Date; weekEnd: Date } {
  const zoned = toZonedTime(date, timeZone);
  const zonedStart = startOfWeek(zoned, { weekStartsOn: 1 });
  const zonedEnd = endOfWeek(zoned, { weekStartsOn: 1 });
  return {
    weekStart: fromZonedTime(zonedStart, timeZone),
    weekEnd: fromZonedTime(zonedEnd, timeZone),
  };
}

export function nextWeekStart(weekStart: Date, timeZone: string = DEFAULT_WEEK_TIMEZONE): Date {
  const zoned = toZonedTime(weekStart, timeZone);
  return fromZonedTime(addWeeks(zoned, 1), timeZone);
}

export function previousWeekStart(weekStart: Date, timeZone: string = DEFAULT_WEEK_TIMEZONE): Date {
  const zoned = toZonedTime(weekStart, timeZone);
  return fromZonedTime(addWeeks(zoned, -1), timeZone);
}

/** 1-based week number relative to `firstWeekStart`, for display (e.g. "Week 4"). */
export function weekNumberFor(weekStart: Date, firstWeekStart: Date, timeZone: string = DEFAULT_WEEK_TIMEZONE): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  // Compare zoned wall-clock instants so DST transitions never round to the wrong week.
  const a = toZonedTime(weekStart, timeZone).getTime();
  const b = toZonedTime(firstWeekStart, timeZone).getTime();
  return Math.round((a - b) / msPerWeek) + 1;
}
