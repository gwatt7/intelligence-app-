import { prisma } from "./db";

/** The season the whole app operates on. Falls back to the most recently created season if none is explicitly marked current, so a fresh install with one season "just works". */
export async function getCurrentSeason() {
  const current = await prisma.season.findFirst({ where: { isCurrent: true } });
  if (current) return current;
  return prisma.season.findFirst({ orderBy: { createdAt: "desc" } });
}

export async function setCurrentSeason(seasonId: string) {
  await prisma.$transaction([
    prisma.season.updateMany({ data: { isCurrent: false }, where: { isCurrent: true } }),
    prisma.season.update({ where: { id: seasonId }, data: { isCurrent: true } }),
  ]);
}
