/**
 * One-time copy of all app data from the old database (Neon) into the
 * database the app now uses (Railway Postgres).
 *
 * Runs in `npm run db:setup` right after `prisma migrate deploy`, so the
 * target already has the current schema. It does nothing unless
 * COPY_FROM_DATABASE_URL is set, and it skips the copy when the target
 * already holds data (so it never runs twice or overwrites anything).
 *
 * If COPY_FROM_DATABASE_URL is set but the old database can't be read, it
 * logs a warning and lets the deploy continue on the new database without
 * the old data.
 *
 * COPY_REPLACE_EXISTING=true lets the copy replace data the fresh setup
 * already created (e.g. the schedule seeded before the old database was
 * reachable). After any successful copy a marker table is written, and the
 * copy never runs again — so leaving either variable set can't wipe data
 * entered later.
 *
 * Every row of every table is copied inside one transaction, then the row
 * counts are checked against the source; any mismatch rolls everything back.
 *
 * Usage: COPY_FROM_DATABASE_URL=postgres://old... DATABASE_URL=postgres://new... npx tsx scripts/copy-from-old-database.ts
 */
import "dotenv/config";
import { Client } from "pg";

const BATCH_ROWS = 100;
const MARKER = "_copied_from_old_database";

type Column = { name: string; dataType: string };

function q(ident: string) {
  return `"${ident.replace(/"/g, '""')}"`;
}

async function main() {
  const sourceUrl = process.env.COPY_FROM_DATABASE_URL;
  if (!sourceUrl) {
    console.log("[copy] COPY_FROM_DATABASE_URL not set; nothing to copy.");
    return;
  }
  const targetUrl = process.env.DATABASE_URL;
  if (!targetUrl) throw new Error("[copy] DATABASE_URL is not set.");
  if (targetUrl === sourceUrl) throw new Error("[copy] COPY_FROM_DATABASE_URL is the same as DATABASE_URL.");

  const target = new Client({ connectionString: targetUrl });
  await target.connect();

  try {
    const { rows: done } = await target.query(`SELECT to_regclass('public.${MARKER}') IS NOT NULL AS done`);
    if (done[0].done) {
      console.log("[copy] Data was already copied from the old database once; skipping. You can remove COPY_FROM_DATABASE_URL and COPY_REPLACE_EXISTING.");
      return;
    }
    const replace = process.env.COPY_REPLACE_EXISTING === "true";
    const { rows: existing } = await target.query(`SELECT count(*)::int AS n FROM "Season"`);
    if (existing[0].n > 0 && !replace) {
      console.log("[copy] Target database already has data; skipping the copy. Set COPY_REPLACE_EXISTING=true to replace it with the old database's data (one time only).");
      return;
    }

    const source = new Client({ connectionString: sourceUrl });
    try {
      await source.connect();
      await source.query("SELECT 1");
    } catch (err) {
      // Don't block the deploy: start on the new database without the old data.
      console.warn(
        `[copy] Can't read the old database (COPY_FROM_DATABASE_URL), so nothing was copied: ${(err as Error).message}\n` +
          "[copy] Continuing on the new database. You can remove COPY_FROM_DATABASE_URL."
      );
      await source.end().catch(() => {});
      return;
    }

    try {
      // Tables present in both databases (skip Prisma's own bookkeeping).
      const tableSql = `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`;
      const sourceTables = new Set((await source.query(tableSql)).rows.map((r) => r.table_name as string));
      const targetTables = (await target.query(tableSql)).rows.map((r) => r.table_name as string);
      const missing = [...sourceTables].filter((t) => !targetTables.includes(t));
      if (missing.length) console.warn(`[copy] Tables only in the old database (not copied): ${missing.join(", ")}`);
      const tables = targetTables.filter((t) => sourceTables.has(t));

      await target.query("BEGIN");
      // Load rows in any order without foreign-key checks; counts are verified below.
      await target.query("SET LOCAL session_replication_role = replica");
      if (replace && existing[0].n > 0) {
        // One-time replace: clear what the fresh setup created. Same
        // transaction as the copy, so a failed copy restores it.
        console.log("[copy] COPY_REPLACE_EXISTING=true: replacing the new database's data with the old database's.");
        await target.query(`TRUNCATE ${tables.map(q).join(", ")} CASCADE`);
      }

      const copied: Record<string, number> = {};
      for (const table of tables) {
        const colSql = `SELECT column_name AS name, data_type AS "dataType" FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`;
        const sourceCols: Column[] = (await source.query(colSql, [table])).rows;
        const targetColNames = new Set((await target.query(colSql, [table])).rows.map((c) => c.name as string));
        const cols = sourceCols.filter((c) => targetColNames.has(c.name));
        const colList = cols.map((c) => q(c.name)).join(", ");

        let offset = 0;
        let count = 0;
        for (;;) {
          const { rows } = await source.query(
            `SELECT ${colList} FROM ${q(table)} ORDER BY ctid LIMIT ${BATCH_ROWS} OFFSET ${offset}`
          );
          if (rows.length === 0) break;

          const values: unknown[] = [];
          const tuples = rows.map((row) => {
            const placeholders = cols.map((c) => {
              let v = row[c.name];
              // pg parses json/jsonb into objects; send them back as JSON text.
              if (v !== null && (c.dataType === "json" || c.dataType === "jsonb")) v = JSON.stringify(v);
              values.push(v);
              return `$${values.length}`;
            });
            return `(${placeholders.join(", ")})`;
          });
          await target.query(`INSERT INTO ${q(table)} (${colList}) VALUES ${tuples.join(", ")}`, values);

          count += rows.length;
          offset += rows.length;
          if (rows.length < BATCH_ROWS) break;
        }
        copied[table] = count;
      }

      // Verify every table's row count matches the source before committing.
      for (const table of tables) {
        const [{ n: s }] = (await source.query(`SELECT count(*)::int AS n FROM ${q(table)}`)).rows;
        const [{ n: t }] = (await target.query(`SELECT count(*)::int AS n FROM ${q(table)}`)).rows;
        if (s !== t) throw new Error(`[copy] Row count mismatch in ${table}: old ${s}, new ${t}. Nothing was saved.`);
      }

      // Marks the copy as done so it can never run (or replace data) again.
      await target.query(`CREATE TABLE ${MARKER} (copied_at timestamptz NOT NULL DEFAULT now())`);
      await target.query(`INSERT INTO ${MARKER} DEFAULT VALUES`);

      await target.query("COMMIT");
      for (const [table, n] of Object.entries(copied)) console.log(`[copy] ${table}: ${n} row(s)`);
      console.log("[copy] Done. All data copied and verified. You can now remove COPY_FROM_DATABASE_URL.");
    } catch (err) {
      await target.query("ROLLBACK").catch(() => {});
      throw err;
    } finally {
      await source.end().catch(() => {});
    }
  } finally {
    await target.end().catch(() => {});
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
