/**
 * Runs before `prisma migrate deploy` in the build.
 *
 * Prisma takes a Postgres advisory lock (key 72707369) while migrating. When
 * migrations ran over Neon's *pooled* connection, the lock could be taken on
 * one server session and the unlock sent on another, leaving the lock held by
 * an idle pooled session. Every later build then failed with
 * "P1002 … Timed out trying to acquire a postgres advisory lock".
 *
 * This script frees that lock only when it is held by a session that has been
 * idle for more than STALE_LOCK_SECONDS (default 60). A migration that is
 * actually running is never idle that long, so it is left alone.
 *
 * It never fails the build: any problem is logged and the build continues
 * (prisma migrate deploy will then report the real error, if any).
 */
import "dotenv/config";
import { Client } from "pg";

const PRISMA_MIGRATE_LOCK_KEY = 72707369; // fits in 32 bits → pg_locks.classid = 0, objid = key
const STALE_AFTER_SECONDS = Number(process.env.STALE_LOCK_SECONDS ?? 60);

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL;
  if (!url) {
    console.log("[migration-lock] No database URL set; skipping.");
    return;
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query<{ pid: number; state: string | null; idle_seconds: number | null }>(
      `SELECT a.pid, a.state, EXTRACT(EPOCH FROM (now() - a.state_change))::int AS idle_seconds
         FROM pg_locks l
         JOIN pg_stat_activity a ON a.pid = l.pid
        WHERE l.locktype = 'advisory' AND l.granted
          AND l.classid = 0 AND l.objid = $1
          AND a.pid <> pg_backend_pid()`,
      [PRISMA_MIGRATE_LOCK_KEY]
    );

    if (rows.length === 0) {
      console.log("[migration-lock] Migration lock is free.");
      return;
    }

    for (const r of rows) {
      const idle = r.state?.startsWith("idle") && (r.idle_seconds ?? 0) > STALE_AFTER_SECONDS;
      if (!idle) {
        console.log(`[migration-lock] Lock held by session pid ${r.pid} (${r.state}, ${r.idle_seconds ?? 0}s) — not stale, leaving it alone.`);
        continue;
      }
      const { rows: done } = await client.query<{ ok: boolean }>("SELECT pg_terminate_backend($1) AS ok", [r.pid]);
      console.log(
        `[migration-lock] Released stale migration lock held by idle session pid ${r.pid} (idle ${r.idle_seconds}s): ${done[0]?.ok ? "ok" : "not permitted"}.`
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.warn("[migration-lock] Check skipped:", err instanceof Error ? err.message : err);
});
