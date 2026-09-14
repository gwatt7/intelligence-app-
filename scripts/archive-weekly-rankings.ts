/**
 * Manually runs the Weekly Performance Rankings archive job — the same
 * logic the Sunday-night Vercel Cron job (app/api/cron/weekly-rankings)
 * calls. Useful for local testing or a manual catch-up run in production.
 * Idempotent: already-archived weeks are skipped.
 *
 * Usage: npx tsx scripts/archive-weekly-rankings.ts
 */
import "dotenv/config";
import { prisma } from "../lib/db";
import { archiveCompletedWeeksForSeason } from "../lib/weekly-rankings";

async function main() {
  const seasons = await prisma.season.findMany({ select: { id: true, name: true } });
  for (const season of seasons) {
    const { archived } = await archiveCompletedWeeksForSeason(season.id);
    console.log(`Season "${season.name}": ${archived.length} week(s) archived`);
    for (const w of archived) {
      console.log(
        `  Week ${w.weekNumber} (${w.weekStart.toISOString().slice(0, 10)} – ${w.weekEnd.toISOString().slice(0, 10)}): ` +
          `top=[${w.top.map((t) => `#${t.jerseyNumber} ${t.name} (${t.performanceScore.toFixed(1)})`).join(", ")}] ` +
          `bottom=[${w.bottom.map((b) => `#${b.jerseyNumber} ${b.name} (${b.performanceScore.toFixed(1)})`).join(", ")}]`
      );
    }
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
