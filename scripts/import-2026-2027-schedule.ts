/**
 * Imports the official UW-Superior Men's Hockey 2026-27 schedule into the
 * 2026-2027 season.
 *
 * Source: https://uwsyellowjackets.com/sports/mens-ice-hockey/schedule/2026-27
 * — provided by the coach (this environment cannot fetch that URL itself;
 * see prisma/seed-data/uws-2026-2027-schedule.json for the full transcribed
 * data and notes on every inference made). Nothing here invents an
 * opponent, location, or time beyond what was given — TBA fields stay null.
 *
 * Idempotent and safe to re-run: each game is upserted on the
 * (seasonId, date, opponent) unique key, so re-running never creates
 * duplicates, and editing this JSON file later (e.g. once the WIAC
 * tournament opponents/times/locations are announced) and re-running just
 * updates those specific rows in place — no season rebuild required.
 *
 * Manual usage: npx tsx scripts/import-2026-2027-schedule.ts
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../lib/db";

const SEASON_NAME = "2026-2027";
const DATA_FILE = path.join(__dirname, "..", "prisma", "seed-data", "uws-2026-2027-schedule.json");

interface ScheduleGame {
  date: string;
  opponent: string;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  arena: string | null;
  city: string | null;
  state: string | null;
  gameType: "PRESEASON" | "REGULAR_SEASON" | "PLAYOFFS";
  tournamentName?: string;
  specialEvent?: string;
  timeTBA?: boolean;
}

async function main() {
  const { games }: { games: ScheduleGame[] } = JSON.parse(readFileSync(DATA_FILE, "utf-8"));

  const season = await prisma.season.findUnique({ where: { name: SEASON_NAME } });
  if (!season) {
    console.log(`Season "${SEASON_NAME}" not found — skipping schedule import.`);
    await prisma.$disconnect();
    return;
  }

  const results: { opponent: string; date: string; action: "created" | "updated" }[] = [];

  for (const g of games) {
    const date = new Date(g.date);
    const data = {
      gameType: g.gameType,
      opponent: g.opponent,
      date,
      homeAway: g.homeAway,
      arena: g.arena,
      city: g.city,
      state: g.state,
      tournamentName: g.tournamentName ?? null,
      specialEvent: g.specialEvent ?? null,
      timeTBA: g.timeTBA ?? false,
    };

    const existing = await prisma.game.findUnique({
      where: { seasonId_date_opponent: { seasonId: season.id, date, opponent: g.opponent } },
    });

    await prisma.game.upsert({
      where: { seasonId_date_opponent: { seasonId: season.id, date, opponent: g.opponent } },
      create: { ...data, season: { connect: { id: season.id } } },
      update: data,
    });

    results.push({ opponent: g.opponent, date: g.date.slice(0, 10), action: existing ? "updated" : "created" });
  }

  console.log(`2026-2027 schedule import: ${results.length} game(s) processed`);
  for (const r of results) {
    console.log(`  ${r.date} — ${r.opponent} — ${r.action}`);
  }

  const total = await prisma.game.count({ where: { seasonId: season.id } });
  console.log(`Total games in ${SEASON_NAME}: ${total}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
