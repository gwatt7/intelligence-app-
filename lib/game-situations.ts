// Game-situation statistics engine — used by player profiles AND team Analytics.
//
// Source of truth = the original recorded lines, never pre-made aggregates:
//   • 5-on-5 ("EVEN")  → GamePlayerStat (one line per player per game)
//   • Power Play / PK  → GameSituationStat (one line per player, game, situation)
//
// Each stat lists which situations actually record it (TRACKED). A view's
// value is the sum over the situations it covers:
//   • "EVEN" / "POWER_PLAY" / "PENALTY_KILL" → that situation only (null if
//     that situation doesn't record the stat — shown as N/A, never 0)
//   • "ALL" (Overall / All Situations) → sum over every situation that
//     records the stat. Each event lives in exactly one situation's line,
//     so summing them never double-counts.
// Percentages are always recalculated from summed counts (never averaged),
// using only situations that record BOTH the numerator and denominator.
//
// Client-safe (no database access).

import { pct } from "@/lib/stats";

export type GameSituation = "EVEN" | "POWER_PLAY" | "PENALTY_KILL";
export type SituationView = "ALL" | GameSituation;
export const GAME_SITUATIONS: GameSituation[] = ["EVEN", "POWER_PLAY", "PENALTY_KILL"];

export const VIEW_LABEL: Record<SituationView, string> = {
  ALL: "All Situations",
  EVEN: "5-on-5",
  POWER_PLAY: "Power Play",
  PENALTY_KILL: "Penalty Kill",
};
export const VIEW_SHORT: Record<GameSituation, string> = { EVEN: "5v5", POWER_PLAY: "PP", PENALTY_KILL: "PK" };

/** URL values for the Analytics situation filter (?situation=5v5|pp|pk; All is the default). */
export const VIEW_PARAMS: { key: SituationView; param: string }[] = [
  { key: "ALL", param: "all" },
  { key: "EVEN", param: "5v5" },
  { key: "POWER_PLAY", param: "pp" },
  { key: "PENALTY_KILL", param: "pk" },
];

export function viewFromParam(v: string | undefined): SituationView {
  return VIEW_PARAMS.find((x) => x.param === v)?.key ?? "ALL";
}

export const COUNT_KEYS = [
  "goals",
  "assists",
  "shots",
  "shotAttempts",
  "faceoffsWon",
  "faceoffsLost",
  "blocks",
  "clears",
  "hits",
  "disruptions",
  "giveaways",
  "scoringChances",
  "zoneEntries",
  "successfulZoneEntries",
  "zoneExits",
  "successfulZoneExits",
  "shotsAgainst",
  "saves",
  "goalsAgainst",
  "timeOnIceSeconds",
] as const;
export type CountKey = (typeof COUNT_KEYS)[number];
export type Counts = Record<CountKey, number>;

/** Which situations record each stat. */
export const TRACKED: Record<GameSituation, ReadonlySet<CountKey>> = {
  EVEN: new Set<CountKey>([
    "goals", "assists", "shots", "faceoffsWon", "faceoffsLost", "blocks", "hits", "disruptions", "giveaways",
    "scoringChances", "zoneEntries", "successfulZoneEntries", "zoneExits", "successfulZoneExits",
    "shotsAgainst", "saves", "goalsAgainst",
  ]),
  POWER_PLAY: new Set<CountKey>(["goals", "assists", "shots", "shotAttempts", "faceoffsWon", "faceoffsLost", "timeOnIceSeconds"]),
  PENALTY_KILL: new Set<CountKey>(["blocks", "clears", "faceoffsWon", "faceoffsLost"]),
};

export const emptyCounts = (): Counts => Object.fromEntries(COUNT_KEYS.map((k) => [k, 0])) as Counts;

/** Per-situation totals for one player or the whole team over some games. */
export type SituationTotals = Record<GameSituation, Counts>;
export const emptyTotals = (): SituationTotals => ({ EVEN: emptyCounts(), POWER_PLAY: emptyCounts(), PENALTY_KILL: emptyCounts() });

type Numeric = Partial<Record<CountKey, number | null | undefined>>;

/** Adds one recorded line into the totals for its situation (only the fields that situation records). */
export function addLine(totals: SituationTotals, situation: GameSituation, line: Numeric): void {
  const target = totals[situation];
  for (const k of TRACKED[situation]) target[k] += line[k] ?? 0;
}

export function mergeTotals(a: SituationTotals, b: SituationTotals): SituationTotals {
  const out = emptyTotals();
  for (const s of GAME_SITUATIONS) for (const k of COUNT_KEYS) out[s][k] = a[s][k] + b[s][k];
  return out;
}

const situationsFor = (view: SituationView): GameSituation[] => (view === "ALL" ? GAME_SITUATIONS : [view]);

export interface StatValue {
  value: number | null;
  /** Situations the value was built from (e.g. ["EVEN","POWER_PLAY"]); empty when not recorded. */
  sources: GameSituation[];
}

/** A counting stat for a view. null = not recorded in that view (N/A). */
export function count(totals: SituationTotals, view: SituationView, key: CountKey): StatValue {
  const sources = situationsFor(view).filter((s) => TRACKED[s].has(key));
  if (sources.length === 0) return { value: null, sources };
  return { value: sources.reduce((a, s) => a + totals[s][key], 0), sources };
}

/** A percentage built from summed counts, using only situations that record both parts. null when not calculable. */
export function ratio(totals: SituationTotals, view: SituationView, num: CountKey | CountKey[], den: CountKey | CountKey[]): StatValue {
  const nums = Array.isArray(num) ? num : [num];
  const dens = Array.isArray(den) ? den : [den];
  const sources = situationsFor(view).filter((s) => [...nums, ...dens].every((k) => TRACKED[s].has(k)));
  if (sources.length === 0) return { value: null, sources };
  const n = sources.reduce((a, s) => a + nums.reduce((x, k) => x + totals[s][k], 0), 0);
  const d = sources.reduce((a, s) => a + dens.reduce((x, k) => x + totals[s][k], 0), 0);
  return { value: pct(n, d), sources };
}

export const points = (t: SituationTotals, v: SituationView): StatValue => {
  const g = count(t, v, "goals"), a = count(t, v, "assists");
  return g.value === null ? g : { value: g.value + (a.value ?? 0), sources: g.sources };
};
export const faceoffPct = (t: SituationTotals, v: SituationView) => ratio(t, v, "faceoffsWon", ["faceoffsWon", "faceoffsLost"]);
/** Goals ÷ shots on goal. */
export const shotConversion = (t: SituationTotals, v: SituationView) => ratio(t, v, "goals", "shots");
/** Shots on goal ÷ shot attempts. */
export const shotAccuracy = (t: SituationTotals, v: SituationView) => ratio(t, v, "shots", "shotAttempts");
export const zoneEntryRate = (t: SituationTotals, v: SituationView) => ratio(t, v, "successfulZoneEntries", "zoneEntries");
export const zoneExitRate = (t: SituationTotals, v: SituationView) => ratio(t, v, "successfulZoneExits", "zoneExits");
export const savePercentage = (t: SituationTotals, v: SituationView) => ratio(t, v, "saves", "shotsAgainst");

/** "5v5 + PP" — which situations a value includes. */
export function sourcesLabel(sources: GameSituation[]): string {
  return sources.map((s) => VIEW_SHORT[s]).join(" + ");
}

// ---------------------------------------------------------------------------
// Team special teams (Power Play % / Penalty Kill %)

export interface SpecialTeamsGame {
  /** null = not recorded for that game */
  powerPlayOpportunities: number | null;
  penaltyKillOpportunities: number | null;
  powerPlayGoalsAgainst: number | null;
  /** Team PP goals = sum of the players' Power Play goals in that game. */
  powerPlayGoals: number;
}

export interface PowerPlaySummary {
  goals: number;
  opportunities: number;
  pct: number | null;
  /** Games where opportunities were recorded (the only games counted). */
  gamesCounted: number;
}

export interface PenaltyKillSummary {
  opportunities: number;
  goalsAgainst: number;
  successfulKills: number;
  pct: number | null;
  gamesCounted: number;
}

/**
 * Power Play % = PP goals ÷ PP opportunities × 100, counting only games where
 * opportunities were recorded (so goals from untracked games can't inflate it).
 */
export function powerPlaySummary(games: SpecialTeamsGame[]): PowerPlaySummary {
  const tracked = games.filter((g) => g.powerPlayOpportunities !== null);
  const goals = tracked.reduce((a, g) => a + g.powerPlayGoals, 0);
  const opportunities = tracked.reduce((a, g) => a + g.powerPlayOpportunities!, 0);
  return { goals, opportunities, pct: pct(goals, opportunities), gamesCounted: tracked.length };
}

/**
 * Penalty Kill % = successful kills ÷ times shorthanded × 100.
 * Under standard minor-penalty rules a power play ends when the opponent
 * scores, so each power-play goal against is one unsuccessful kill (capped at
 * the game's opportunities, so a major with two goals can't count twice).
 * Only games with both numbers recorded are counted.
 */
export function penaltyKillSummary(games: SpecialTeamsGame[]): PenaltyKillSummary {
  const tracked = games.filter((g) => g.penaltyKillOpportunities !== null && g.powerPlayGoalsAgainst !== null);
  let opportunities = 0, goalsAgainst = 0, failed = 0;
  for (const g of tracked) {
    opportunities += g.penaltyKillOpportunities!;
    goalsAgainst += g.powerPlayGoalsAgainst!;
    failed += Math.min(g.powerPlayGoalsAgainst!, g.penaltyKillOpportunities!);
  }
  const successfulKills = opportunities - failed;
  return { opportunities, goalsAgainst, successfulKills, pct: pct(successfulKills, opportunities), gamesCounted: tracked.length };
}
