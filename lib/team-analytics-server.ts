import { prisma } from "@/lib/db";
import { sumStatLines } from "@/lib/stats";
import type { TeamStatEntry } from "@/lib/team-analytics";

export async function getTeamStatEntries(seasonId: string): Promise<TeamStatEntry[]> {
  const [practices, games] = await Promise.all([
    prisma.practice.findMany({ where: { seasonId }, include: { playerStats: true } }),
    prisma.game.findMany({ where: { seasonId }, include: { playerStats: true } }),
  ]);

  const entries: TeamStatEntry[] = [
    ...practices.map((p) => ({
      id: p.id,
      date: p.date,
      source: "PRACTICE" as const,
      label: `Practice ${p.number}`,
      stat: sumStatLines(p.playerStats),
    })),
    ...games.map((g) => ({
      id: g.id,
      date: g.date,
      source: "GAME" as const,
      label: `vs ${g.opponent}`,
      stat: sumStatLines(g.playerStats),
    })),
  ];

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  return entries;
}
