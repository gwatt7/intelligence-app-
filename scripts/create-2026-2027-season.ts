/**
 * Creates the 2026-2027 season from the existing 2025-2026 roster.
 *
 * Copies each 2025-2026 player's profile fields (name, jersey number,
 * position, shoots) into a new Player row in 2026-2027. Deliberately does
 * NOT copy any PracticePlayerStat, GamePlayerStat, or PlayerSeasonStat rows
 * — every carried-over player starts 2026-2027 with zero stats, which is
 * simply the absence of rows (every stat calculation in the app already
 * treats "no logged practices/games" as the zero/empty state). 2025-2026's
 * own rows are never touched.
 *
 * Idempotent — safe to re-run. If "2026-2027" already exists, this is a
 * no-op (matches scripts/import-historical-season.ts's pattern), so it can
 * run as part of every `npm run build` without re-running the copy or
 * re-flipping which season is current.
 *
 * Manual usage: npx tsx scripts/create-2026-2027-season.ts
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const SOURCE_SEASON_NAME = "2025-2026";
const NEW_SEASON_NAME = "2026-2027";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const alreadyExists = await prisma.season.findUnique({ where: { name: NEW_SEASON_NAME } });
  if (alreadyExists) {
    console.log(`Season "${NEW_SEASON_NAME}": already existed — skipping (idempotent, no changes made)`);
    await prisma.$disconnect();
    return;
  }

  const sourceSeason = await prisma.season.findUnique({ where: { name: SOURCE_SEASON_NAME } });
  if (!sourceSeason) {
    console.log(`Source season "${SOURCE_SEASON_NAME}" not found — skipping 2026-2027 creation.`);
    await prisma.$disconnect();
    return;
  }

  const [sourceTeam, sourcePlayers] = await Promise.all([
    prisma.team.findUnique({ where: { seasonId: sourceSeason.id } }),
    prisma.player.findMany({ where: { seasonId: sourceSeason.id }, orderBy: { jerseyNumber: "asc" } }),
  ]);

  await prisma.$transaction(async (tx) => {
    await tx.season.updateMany({ data: { isCurrent: false }, where: { isCurrent: true } });
    const newSeason = await tx.season.create({ data: { name: NEW_SEASON_NAME, isCurrent: true } });

    await tx.team.create({
      data: {
        seasonId: newSeason.id,
        name: sourceTeam?.name ?? "New Team",
        league: sourceTeam?.league,
        division: sourceTeam?.division,
        headCoach: sourceTeam?.headCoach,
        assistantCoaches: sourceTeam?.assistantCoaches,
      },
    });

    if (sourcePlayers.length > 0) {
      await tx.player.createMany({
        data: sourcePlayers.map((p) => ({
          seasonId: newSeason.id,
          firstName: p.firstName,
          lastName: p.lastName,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
          shoots: p.shoots,
        })),
      });
    }
  });

  console.log(`Season "${NEW_SEASON_NAME}": created from "${SOURCE_SEASON_NAME}"`);
  console.log(`Players carried forward: ${sourcePlayers.length}`);
  for (const p of sourcePlayers) {
    console.log(`  #${p.jerseyNumber} ${p.firstName} ${p.lastName} (${p.position})`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
