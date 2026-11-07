// Official Game team-wide stats ONLY — see lib/player-analytics.ts's header
// comment for why Mini Game data is never queried here.

import { prisma } from "@/lib/db";
import { sumTrackedStatLines } from "@/lib/stats";
import type { TeamStatEntry } from "@/lib/team-analytics";

export async function getTeamStatEntries(seasonId: string): Promise<TeamStatEntry[]> {
  const games = await prisma.game.findMany({ where: { seasonId }, include: { playerStats: true } });

  const entries: TeamStatEntry[] = games.map((g) => ({
    id: g.id,
    date: g.date,
    label: `vs ${g.opponent}`,
    // Each player's row carries untrackedFields as a sibling, not nested —
    // wrap it into the {stat, untrackedFields} shape sumTrackedStatLines expects.
    stat: sumTrackedStatLines(g.playerStats.map((s) => ({ stat: s, untrackedFields: s.untrackedFields }))).sums,
  }));

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  return entries;
}
