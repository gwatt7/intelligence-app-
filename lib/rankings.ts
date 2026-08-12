import { prisma } from "@/lib/db";
import { sumStatLines, zoneEntryPct, zoneExitPct } from "@/lib/stats";
import { getSeasonStatEntriesByPlayer, performanceIndexForEntries, recentTrendForEntries } from "@/lib/player-analytics";

export interface RankedPlayer {
  playerId: string;
  name: string;
  jerseyNumber: number;
  value: number;
}

/** Simple, explainable Version 1 rankings — no weighting or scoring model beyond what's already visible on the Player profile. Only players with at least one logged practice or game are eligible, so an unranked player never wins a category by default (e.g. zero giveaways from having no data at all). */
export async function buildRankings(seasonId: string) {
  const players = await prisma.player.findMany({ where: { seasonId } });
  const entriesByPlayer = await getSeasonStatEntriesByPlayer(seasonId);

  const withData = players.filter((p) => (entriesByPlayer.get(p.id) ?? []).length > 0);

  function rank(value: (p: (typeof players)[number]) => number | null, descending = true): RankedPlayer[] {
    return withData
      .map((p) => ({
        playerId: p.id,
        name: `${p.firstName} ${p.lastName}`,
        jerseyNumber: p.jerseyNumber,
        value: value(p),
      }))
      .filter((r): r is RankedPlayer => r.value !== null)
      .sort((a, b) => (descending ? b.value - a.value : a.value - b.value))
      .slice(0, 5);
  }

  const totalsByPlayer = new Map(
    withData.map((p) => [p.id, sumStatLines((entriesByPlayer.get(p.id) ?? []).map((e) => e.stat))])
  );

  return {
    topPerformanceIndex: rank((p) => performanceIndexForEntries(entriesByPlayer.get(p.id) ?? [], p.position)?.score ?? null),
    mostImproved: rank((p) => recentTrendForEntries(entriesByPlayer.get(p.id) ?? [], p.position)),
    bestZoneEntryPct: rank((p) => zoneEntryPct(totalsByPlayer.get(p.id)!)),
    bestZoneExitPct: rank((p) => zoneExitPct(totalsByPlayer.get(p.id)!)),
    mostTakeaways: rank((p) => totalsByPlayer.get(p.id)!.takeaways),
    lowestGiveaways: rank((p) => totalsByPlayer.get(p.id)!.giveaways, false),
    mostScoringChances: rank((p) => totalsByPlayer.get(p.id)!.scoringChances),
  };
}

/**
 * Top/bottom 3 performance-index scores for the most recent week of
 * logged activity. Anchored to the latest practice/game date in the data
 * (not the calendar date), so this stays meaningful once a season is
 * complete or hasn't started yet — it never fabricates a "this week" that
 * has no real practices or games behind it.
 */
export async function buildWeeklyPerformers(seasonId: string): Promise<{ top: RankedPlayer[]; bottom: RankedPlayer[] }> {
  const players = await prisma.player.findMany({ where: { seasonId } });
  const entriesByPlayer = await getSeasonStatEntriesByPlayer(seasonId);

  let latestDate: Date | null = null;
  for (const entries of entriesByPlayer.values()) {
    for (const e of entries) {
      if (!latestDate || e.date > latestDate) latestDate = e.date;
    }
  }
  if (!latestDate) return { top: [], bottom: [] };

  const windowStart = new Date(latestDate);
  windowStart.setDate(windowStart.getDate() - 6);

  const ranked = players
    .map((p) => {
      const weekEntries = (entriesByPlayer.get(p.id) ?? []).filter(
        (e) => e.date >= windowStart && e.date <= latestDate!
      );
      const score = performanceIndexForEntries(weekEntries, p.position)?.score ?? null;
      return score === null
        ? null
        : { playerId: p.id, name: `${p.firstName} ${p.lastName}`, jerseyNumber: p.jerseyNumber, value: score };
    })
    .filter((r): r is RankedPlayer => r !== null)
    .sort((a, b) => b.value - a.value);

  const top = ranked.slice(0, 3);
  const topIds = new Set(top.map((r) => r.playerId));
  const bottom = ranked
    .slice()
    .reverse()
    .filter((r) => !topIds.has(r.playerId))
    .slice(0, 3);

  return { top, bottom };
}
