// Tunables for the Weekly Performance Rankings feature. Kept in one place,
// separate from the calculation logic, so any of these can be changed later
// without touching lib/weekly-rankings.ts.

/**
 * IANA timezone the Sunday-night archive boundary and "current week" window
 * are computed in. Weeks run Monday 00:00:00 through Sunday 23:59:59.999 in
 * this timezone. Change this if the team is based somewhere other than
 * Wisconsin.
 */
export const WEEKLY_RANKING_TIMEZONE = "America/Chicago";

/**
 * Minimum number of logged practice/game stat rows a player must have within
 * a week to qualify for that week's Top 3 / Bottom 3. Players below this are
 * shown as "Insufficient Data" instead of being ranked. Raise this if a
 * single logged practice shouldn't be enough to land someone in the
 * rankings; lower it (minimum 1) to rank on any data at all.
 */
export const MIN_WEEKLY_ENTRIES_FOR_RANKING = 2;

/**
 * Bumped only if the underlying scoring formula changes (e.g. a future
 * Performance Index v2). Stored on every archived week so old rankings stay
 * self-describing even after the formula evolves.
 */
export const WEEKLY_SCORING_VERSION = "performance-index-v1";
