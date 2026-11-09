// Runs once when a Next.js server starts.
export async function register() {
  // Only the Node.js server can reach the database; skip the build step
  // (no database there on Railway) and the edge runtime.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { startWeeklyRankingsAutorun } = await import("@/lib/weekly-rankings-autorun");
  startWeeklyRankingsAutorun();
}
