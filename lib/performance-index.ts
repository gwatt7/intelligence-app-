// Performance Index — Version 1
//
// This is a coaching analytics tool, NOT an objective measure of player
// value. It is a simple, transparent, weighted composite of rate stats,
// scaled 0-100. Weights live in one place below so future versions can
// re-tune (or expose per-team configuration) without touching call sites.

import { RawStatLine, zoneEntryPct, zoneExitPct, points, savePct } from "./stats";

export const SKATER_WEIGHTS = {
  zoneEntryPct: 0.2,
  zoneExitPct: 0.2,
  pointsPerGame: 0.2,
  scoringChancesPerGame: 0.15,
  takeawayGiveawayPerGame: 0.15,
  physicalPerGame: 0.1,
} as const;

export const GOALIE_WEIGHTS = {
  savePct: 1,
} as const;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/** Scales a per-game rate onto a 0-100 axis using a reference rate that would itself score 100. Simple linear cap — deliberately not a curve. */
function scaleRate(perGame: number, referenceForFullScore: number): number {
  if (referenceForFullScore <= 0) return 0;
  return clamp((perGame / referenceForFullScore) * 100);
}

export interface PerformanceIndexBreakdown {
  score: number;
  components: { label: string; weight: number; scaledValue: number; contribution: number }[];
}

export function calculateSkaterPerformanceIndex(
  totals: RawStatLine,
  gamesPlayed: number
): PerformanceIndexBreakdown {
  const games = Math.max(gamesPlayed, 1);

  const entryPct = zoneEntryPct(totals) ?? 0;
  const exitPct = zoneExitPct(totals) ?? 0;
  const ptsPerGame = points(totals) / games;
  const chancesPerGame = totals.scoringChances / games;
  const takeawayGiveawayPerGame = (totals.takeaways - totals.giveaways) / games;
  const physicalPerGame = (totals.hits + totals.blocks) / games;

  const components = [
    { label: "Zone Entry %", weight: SKATER_WEIGHTS.zoneEntryPct, scaledValue: clamp(entryPct) },
    { label: "Zone Exit %", weight: SKATER_WEIGHTS.zoneExitPct, scaledValue: clamp(exitPct) },
    {
      label: "Points / Game",
      weight: SKATER_WEIGHTS.pointsPerGame,
      scaledValue: scaleRate(ptsPerGame, 2), // 2 pts/game -> full score
    },
    {
      label: "Scoring Chances / Game",
      weight: SKATER_WEIGHTS.scoringChancesPerGame,
      scaledValue: scaleRate(chancesPerGame, 5), // 5 chances/game -> full score
    },
    {
      label: "Takeaway − Giveaway / Game",
      weight: SKATER_WEIGHTS.takeawayGiveawayPerGame,
      scaledValue: scaleRate(takeawayGiveawayPerGame + 3, 6), // shift so 0 net sits mid-scale
    },
    {
      label: "Physical Play / Game",
      weight: SKATER_WEIGHTS.physicalPerGame,
      scaledValue: scaleRate(physicalPerGame, 4), // 4 hits+blocks/game -> full score
    },
  ].map((c) => ({ ...c, contribution: c.weight * c.scaledValue }));

  const score = clamp(components.reduce((sum, c) => sum + c.contribution, 0));

  return { score, components };
}

export function calculateGoaliePerformanceIndex(totals: RawStatLine): PerformanceIndexBreakdown {
  const save = savePct(totals) ?? 0;
  const components = [
    { label: "Save %", weight: GOALIE_WEIGHTS.savePct, scaledValue: clamp(save) },
  ].map((c) => ({ ...c, contribution: c.weight * c.scaledValue }));

  return { score: clamp(components.reduce((sum, c) => sum + c.contribution, 0)), components };
}

export function calculatePerformanceIndex(
  position: "FORWARD" | "DEFENSE" | "GOALIE",
  totals: RawStatLine,
  gamesPlayed: number
): PerformanceIndexBreakdown {
  return position === "GOALIE"
    ? calculateGoaliePerformanceIndex(totals)
    : calculateSkaterPerformanceIndex(totals, gamesPlayed);
}
