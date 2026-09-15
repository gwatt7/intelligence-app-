/**
 * One-off, idempotent per-player hero-image assignments — real coach-supplied
 * action photos shown behind the Player Profile hero card (see
 * components/players/PlayerProfileHero.tsx). Wired into `npm run build` like
 * the other schedule/season data scripts so these real assignments actually
 * reach the production database on deploy, not just a local sandbox.
 *
 * Applies to every season-row for that player (name + jersey number), since
 * it's the same real person's photo regardless of which season is selected.
 * Safe to re-run: skips a player whose heroImageUrl already matches.
 *
 * Usage: npx tsx scripts/set-player-hero-images.ts
 */
import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { prisma } from "../lib/db";

const ASSIGNMENTS: { firstName: string; lastName: string; jerseyNumber: number; file: string }[] = [
  { firstName: "Jordan", lastName: "Gibbs", jerseyNumber: 2, file: "jordan-gibbs-hero.jpg" },
];

async function main() {
  for (const a of ASSIGNMENTS) {
    const players = await prisma.player.findMany({
      where: { firstName: a.firstName, lastName: a.lastName, jerseyNumber: a.jerseyNumber },
    });
    if (players.length === 0) {
      console.log(`${a.firstName} ${a.lastName} #${a.jerseyNumber}: not found on any roster — skipping`);
      continue;
    }

    const buf = readFileSync(path.join(__dirname, "..", "prisma", "seed-assets", a.file));
    const dataUri = `data:image/jpeg;base64,${buf.toString("base64")}`;

    for (const player of players) {
      if (player.heroImageUrl === dataUri) {
        console.log(`${a.firstName} ${a.lastName} (season ${player.seasonId}): hero image already set — skipping`);
        continue;
      }
      await prisma.player.update({ where: { id: player.id }, data: { heroImageUrl: dataUri } });
      console.log(`${a.firstName} ${a.lastName} (season ${player.seasonId}): hero image set`);
    }
  }
}

main().finally(() => prisma.$disconnect());
