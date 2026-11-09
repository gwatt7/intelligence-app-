// Runs the Weekly Performance Rankings archive from inside the app, so it
// doesn't depend on an outside scheduler (Vercel Cron used to trigger it).
//
// Started once per server from instrumentation.ts: it runs shortly after the
// server starts and then every hour. archiveCompletedWeeksForSeason() only
// archives finished weeks that have no record yet, so running it often is
// harmless — most runs find nothing to do. The /api/cron/weekly-rankings
// route still works for a manual or external trigger.

import { prisma } from "@/lib/db";
import { archiveCompletedWeeksForSeason } from "@/lib/weekly-rankings";

const HOUR_MS = 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;

let started = false;
let running = false;

/** Archives any finished, not-yet-archived weeks for every season. Never throws. */
export async function catchUpWeeklyRankings(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const seasons = await prisma.season.findMany({ select: { id: true, name: true } });
    for (const season of seasons) {
      try {
        const { archived } = await archiveCompletedWeeksForSeason(season.id);
        if (archived.length > 0) {
          console.log(`[weekly-rankings] ${season.name}: archived ${archived.length} week(s)`);
        }
      } catch (err) {
        // P2002 = another server instance archived the same week first. Fine.
        if ((err as { code?: string })?.code !== "P2002") {
          console.error(`[weekly-rankings] ${season.name}: archive failed`, err);
        }
      }
    }
  } catch (err) {
    console.error("[weekly-rankings] catch-up failed", err);
  } finally {
    running = false;
  }
}

/** Starts the hourly catch-up timer. Safe to call more than once. */
export function startWeeklyRankingsAutorun(): void {
  if (started) return;
  started = true;
  const first = setTimeout(catchUpWeeklyRankings, FIRST_RUN_DELAY_MS);
  const every = setInterval(catchUpWeeklyRankings, HOUR_MS);
  // Don't keep the process alive just for these timers.
  first.unref?.();
  every.unref?.();
}
