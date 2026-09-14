/**
 * One-time cleanup: removes every manually-added scheduled game from the
 * 2026-2027 season only. 2025-2026 (and any other season) is never
 * touched.
 *
 * This app has no "official" games import — every Game row is created by
 * hand through the Add Game form (the historical stats import deliberately
 * never creates Game or Practice rows, so there's nothing else a game could
 * be). "All the games I added" therefore means every Game row under
 * 2026-2027.
 *
 * Deleting a Game cascades ONLY to its own GamePlayerStat and WarRoom (and
 * WarRoom's own Objective/PlayerHighlight) rows — see the onDelete: Cascade
 * relations in prisma/schema.prisma. Season, Team, Player, PlayerSeasonStat,
 * Practice, and PracticePlayerStat rows are never touched by this script.
 *
 * Idempotent via a marker Activity row: the deletion runs exactly once. On
 * every later run (including every future build) it finds the marker and
 * does nothing — so it's safe to leave in the build pipeline permanently
 * and it will NEVER delete a game added after this cleanup ran.
 *
 * Manual usage: npx tsx scripts/cleanup-scheduled-games.ts
 */
import "dotenv/config";
import { prisma } from "../lib/db";

const TARGET_SEASON_NAME = "2026-2027";
const MARKER_MESSAGE = `Scheduled-games cleanup: removed all manually-added games from ${TARGET_SEASON_NAME}`;

async function main() {
  const season = await prisma.season.findUnique({ where: { name: TARGET_SEASON_NAME } });
  if (!season) {
    console.log(`Scheduled-games cleanup: season "${TARGET_SEASON_NAME}" not found — nothing to do.`);
    await prisma.$disconnect();
    return;
  }

  const alreadyRan = await prisma.activity.findFirst({ where: { message: MARKER_MESSAGE, seasonId: season.id } });
  if (alreadyRan) {
    console.log("Scheduled-games cleanup: already ran — skipping (idempotent, no changes made)");
    await prisma.$disconnect();
    return;
  }

  const games = await prisma.game.findMany({
    where: { seasonId: season.id },
    orderBy: { date: "asc" },
  });

  if (games.length === 0) {
    console.log(`Scheduled-games cleanup: no games found in ${TARGET_SEASON_NAME} — nothing to remove.`);
  } else {
    console.log(`Scheduled-games cleanup: removing ${games.length} game(s) from ${TARGET_SEASON_NAME}:`);
    for (const g of games) {
      console.log(
        `  ${g.gameType} ${g.homeAway === "HOME" ? "vs" : "@"} ${g.opponent} — ` +
          `${g.date.toISOString().slice(0, 10)}${g.isCompleted ? ` (final ${g.ourScore}-${g.opponentScore})` : ""}`
      );
    }
    await prisma.game.deleteMany({ where: { id: { in: games.map((g) => g.id) } } });
  }

  // Record the marker on the 2026-2027 season specifically, so this never
  // runs its deletion again for this season, regardless of which season is
  // "current" at the time.
  await prisma.activity.create({
    data: { seasonId: season.id, type: "GAME_LOGGED", message: MARKER_MESSAGE },
  });

  console.log(`Scheduled-games cleanup complete. Removed ${games.length} game(s) from ${TARGET_SEASON_NAME}.`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
