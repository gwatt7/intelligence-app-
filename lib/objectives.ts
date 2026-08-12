import { RawStatLine, getStatValue } from "@/lib/stats";
import type { $Enums } from "@/app/generated/prisma/client";

export const METRIC_TO_STAT_KEY: Record<$Enums.ObjectiveMetric, string> = {
  GIVEAWAYS: "giveaways",
  TAKEAWAYS: "takeaways",
  ZONE_ENTRY_PCT: "zoneEntryPct",
  ZONE_EXIT_PCT: "zoneExitPct",
  SCORING_CHANCES: "scoringChances",
  GOALS: "goals",
  SHOTS: "shots",
  HITS: "hits",
  BLOCKS: "blocks",
  DISRUPTIONS: "disruptions",
};

export const METRIC_LABEL: Record<$Enums.ObjectiveMetric, string> = {
  GIVEAWAYS: "Giveaways",
  TAKEAWAYS: "Takeaways",
  ZONE_ENTRY_PCT: "Zone Entry %",
  ZONE_EXIT_PCT: "Zone Exit %",
  SCORING_CHANCES: "Scoring Chances",
  GOALS: "Goals",
  SHOTS: "Shots",
  HITS: "Hits",
  BLOCKS: "Blocks",
  DISRUPTIONS: "Disruptions",
};

export function actualValueForMetric(metric: $Enums.ObjectiveMetric, teamTotals: RawStatLine): number | null {
  return getStatValue(teamTotals, METRIC_TO_STAT_KEY[metric]);
}

/**
 * Version 1 evaluation: a simple deterministic band around the target, not a
 * scoring model. "Partially achieved" is a 15% cushion around the target so
 * close misses aren't lumped in with "not achieved".
 */
export function evaluateObjective(
  comparator: $Enums.ObjectiveComparator,
  target: number,
  actual: number
): $Enums.ObjectiveStatus {
  if (comparator === "LESS_THAN_OR_EQUAL") {
    if (actual <= target) return "ACHIEVED";
    if (actual <= target * 1.15) return "PARTIALLY_ACHIEVED";
    return "NOT_ACHIEVED";
  }
  if (actual >= target) return "ACHIEVED";
  if (actual >= target * 0.85) return "PARTIALLY_ACHIEVED";
  return "NOT_ACHIEVED";
}
