/**
 * Ensures the 2026-2027 season has the 2025-2026 roster carried forward.
 *
 * Copies each 2025-2026 player's profile fields (name, jersey number,
 * position, shoots) into a Player row in 2026-2027, matched by jersey
 * number so re-runs never create duplicates — same pattern as
 * scripts/import-historical-season.ts. Deliberately does NOT copy any
 * PracticePlayerStat, GamePlayerStat, or PlayerSeasonStat rows: every
 * carried-over player starts 2026-2027 with zero stats, which is simply
 * the absence of rows (every stat calculation in the app already treats
 * "no logged practices/games" as the zero/empty state). 2025-2026's own
 * rows are never touched.
 *
 * If "2026-2027" doesn't exist yet, it's created (with team info carried
 * forward from 2025-2026) and set as the current season. If it already
 * exists — e.g. a coach created it by hand from the "+ New Season" button
 * before this script existed — its team info and current-season flag are
 * left exactly as they are; only missing players are backfilled in.
 *
 * Idempotent — safe to re-run as part of every `npm run build`.
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
  const sourceSeason = await prisma.season.findUnique({ where: { name: SOURCE_SEASON_NAME } });
  if (!sourceSeason) {
    console.log(`Source season "${SOURCE_SEASON_NAME}" not found — skipping 2026-2027 setup.`);
    await prisma.$disconnect();
    return;
  }

  const sourcePlayers = await prisma.player.findMany({
    where: { seasonId: sourceSeason.id },
    orderBy: { jerseyNumber: "asc" },
  });

  let newSeason = await prisma.season.findUnique({ where: { name: NEW_SEASON_NAME } });
  let seasonCreated = false;

  if (!newSeason) {
    const sourceTeam = await prisma.team.findUnique({ where: { seasonId: sourceSeason.id } });
    newSeason = await prisma.$transaction(async (tx) => {
      await tx.season.updateMany({ data: { isCurrent: false }, where: { isCurrent: true } });
      const season = await tx.season.create({ data: { name: NEW_SEASON_NAME, isCurrent: true } });
      await tx.team.create({
        data: {
          seasonId: season.id,
          name: sourceTeam?.name ?? "New Team",
          league: sourceTeam?.league,
          division: sourceTeam?.division,
          headCoach: sourceTeam?.headCoach,
          assistantCoaches: sourceTeam?.assistantCoaches,
        },
      });
      return season;
    });
    seasonCreated = true;
  }

  const existingTargetPlayers = await prisma.player.findMany({ where: { seasonId: newSeason.id } });
  const existingJerseys = new Set(existingTargetPlayers.map((p) => p.jerseyNumber));
  const missingPlayers = sourcePlayers.filter((p) => !existingJerseys.has(p.jerseyNumber));

  if (missingPlayers.length > 0) {
    await prisma.player.createMany({
      data: missingPlayers.map((p) => ({
        seasonId: newSeason!.id,
        firstName: p.firstName,
        lastName: p.lastName,
        jerseyNumber: p.jerseyNumber,
        position: p.position,
        shoots: p.shoots,
      })),
    });
  }

  console.log(`Season "${NEW_SEASON_NAME}": ${seasonCreated ? "created" : "already existed"}`);
  console.log(`Players backfilled from "${SOURCE_SEASON_NAME}": ${missingPlayers.length}`);
  for (const p of missingPlayers) {
    console.log(`  #${p.jerseyNumber} ${p.firstName} ${p.lastName} (${p.position})`);
  }
  const total = await prisma.player.count({ where: { seasonId: newSeason.id } });
  console.log(`Total players in ${NEW_SEASON_NAME}: ${total}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
