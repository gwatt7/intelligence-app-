// Sunday-night Weekly Performance Rankings archive job.
//
// Triggered by Vercel Cron (see vercel.json — "0 5 * * 1", i.e. Monday
// 05:00 UTC, which lands late Sunday night / just after midnight Central
// depending on daylight saving). The exact fire time isn't precision-
// critical: archiveCompletedWeeksForSeason() archives every fully-completed
// week that doesn't have a record yet, so a run that's early, late, or even
// missed entirely just catches up in full on its next invocation — nothing
// is lost and nothing is double-archived (see the @@unique([seasonId,
// weekStart]) guard in the schema).
//
// Runs for every season with logged stats, not just the current one, so a
// season that's no longer "current" still gets its trailing week(s)
// archived correctly if the coach switched seasons mid-week.

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { archiveCompletedWeeksForSeason } from "@/lib/weekly-rankings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const seasons = await prisma.season.findMany({ select: { id: true, name: true } });

  const results = [];
  let anyArchived = false;
  for (const season of seasons) {
    const { archived } = await archiveCompletedWeeksForSeason(season.id);
    if (archived.length > 0) anyArchived = true;
    results.push({
      seasonId: season.id,
      seasonName: season.name,
      weeksArchived: archived.map((w) => ({ weekNumber: w.weekNumber, weekStart: w.weekStart })),
    });
  }

  // A Route Handler's writes don't invalidate the page cache the way a
  // Server Action's do, so the newly-archived week(s) need an explicit
  // revalidation to show up immediately on next visit instead of waiting
  // for some unrelated stat edit (or the next deploy) to refresh them.
  if (anyArchived) {
    revalidatePath("/weekly-rankings");
    revalidatePath("/");
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), results });
}
