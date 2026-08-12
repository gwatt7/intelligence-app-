/**
 * One-time historical import: University of Wisconsin–Superior Hockey,
 * 2025-2026 season roster + report-card statistics.
 *
 * Source: Report Cards.xlsx (parsed offline into
 * prisma/seed-data/uws-2025-2026-report-cards.json — see that file for the
 * exact per-player fields; nothing here invents data beyond what the sheet
 * contained). Deliberately does NOT create any Practice or Game rows: the
 * source data is season aggregates, not individual games, so there's
 * nothing legitimate to attach them to.
 *
 * Idempotent — safe to re-run. Existing players are matched by
 * (season, jersey number) and updated in place rather than duplicated.
 *
 * Usage: npx tsx scripts/import-historical-season.ts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const SEASON_NAME = "2025-2026";
const TEAM_NAME = "University of Wisconsin–Superior Hockey";
const DATA_FILE = path.join(__dirname, "..", "prisma", "seed-data", "uws-2025-2026-report-cards.json");

interface MappedPlayer {
  jersey: number;
  name: string;
  position: "FORWARD" | "DEFENSE" | "GOALIE";
  typed: Record<string, number | null>;
  rawStats: Record<string, unknown>;
  coachNotes: string | null;
}

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
  const mapped: Record<string, MappedPlayer> = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
  const playerList = Object.values(mapped).sort((a, b) => a.jersey - b.jersey);

  let season = await prisma.season.findUnique({ where: { name: SEASON_NAME } });
  const seasonCreated = !season;
  if (!season) {
    season = await prisma.season.create({ data: { name: SEASON_NAME, isCurrent: false } });
  }

  let team = await prisma.team.findUnique({ where: { seasonId: season.id } });
  const teamCreated = !team;
  if (!team) {
    team = await prisma.team.create({ data: { season: { connect: { id: season.id } }, name: TEAM_NAME } });
  }

  const results: { jersey: number; name: string; position: string; playerAction: "created" | "existing" }[] = [];

  for (const p of playerList) {
    const [firstName, ...rest] = p.name.trim().split(/\s+/);
    const lastName = rest.join(" ");

    const existing = await prisma.player.findUnique({
      where: { seasonId_jerseyNumber: { seasonId: season.id, jerseyNumber: p.jersey } },
    });

    const player = existing
      ? await prisma.player.update({
          where: { id: existing.id },
          data: { firstName, lastName, position: p.position },
        })
      : await prisma.player.create({
          data: {
            season: { connect: { id: season.id } },
            firstName,
            lastName,
            jerseyNumber: p.jersey,
            position: p.position,
            shoots: null, // not recorded in the source data
          },
        });

    const statData = {
      source: "Imported from Report Cards.xlsx",
      ...p.typed,
      rawStats: JSON.parse(JSON.stringify(p.rawStats)),
      coachNotes: p.coachNotes,
    };

    await prisma.playerSeasonStat.upsert({
      where: { playerId_seasonId: { playerId: player.id, seasonId: season.id } },
      create: { player: { connect: { id: player.id } }, season: { connect: { id: season.id } }, ...statData },
      update: statData,
    });

    results.push({ jersey: p.jersey, name: p.name, position: p.position, playerAction: existing ? "existing" : "created" });
  }

  console.log(`Season "${SEASON_NAME}": ${seasonCreated ? "created" : "already existed"}`);
  console.log(`Team "${TEAM_NAME}": ${teamCreated ? "created" : "already existed"}`);
  console.log(`\nPlayers processed: ${results.length}`);
  for (const r of results) {
    console.log(`  #${r.jersey} ${r.name} (${r.position}) — ${r.playerAction}`);
  }

  const total = await prisma.player.count({ where: { seasonId: season.id } });
  console.log(`\nTotal players in ${SEASON_NAME}: ${total}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
