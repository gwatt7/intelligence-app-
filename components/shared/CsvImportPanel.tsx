"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const EXPECTED_COLUMNS = [
  "jerseyNumber",
  "zoneEntries",
  "successfulZoneEntries",
  "zoneExits",
  "successfulZoneExits",
  "goals",
  "assists",
  "shots",
  "scoringChances",
  "goodOpportunities",
  "badOpportunities",
  "disruptions",
  "hits",
  "blocks",
  "takeaways",
  "giveaways",
  "shotsAgainst",
  "goalsAgainst",
  "saves",
];

type ImportResult = { ok: true; imported: number; skipped: number[] } | { ok: false; error: string };

export function CsvImportPanel({
  onImport,
}: {
  onImport: (rows: Record<string, number>[]) => Promise<ImportResult>;
}) {
  const [rows, setRows] = useState<Record<string, number>[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    setParseError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        if (res.errors.length > 0) {
          setParseError(res.errors[0].message);
          setRows(null);
          return;
        }
        const numericRows = res.data.map((row) => {
          const numeric: Record<string, number> = {};
          for (const key of Object.keys(row)) {
            const n = Number(row[key]);
            numeric[key] = Number.isFinite(n) ? n : 0;
          }
          return numeric;
        });
        setRows(numericRows);
      },
      error: (err) => setParseError(err.message),
    });
  }

  async function handleImport() {
    if (!rows) return;
    setImporting(true);
    const res = await onImport(rows);
    setResult(res);
    setImporting(false);
    if (res.ok) setRows(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        CSV columns expected: <code className="text-muted-2">{EXPECTED_COLUMNS.join(", ")}</code>. One row per
        player, matched by jersey number.
      </p>
      <input
        type="file"
        accept=".csv"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-sm text-muted"
      />
      {parseError && <p className="text-sm text-negative">Could not parse file: {parseError}</p>}
      {rows && (
        <div className="flex items-center gap-3">
          <Badge tone="accent">
            {fileName}: {rows.length} row(s) ready
          </Badge>
          <Button onClick={handleImport} disabled={importing}>
            {importing ? "Importing…" : "Import Stats"}
          </Button>
        </div>
      )}
      {result && !result.ok && <p className="text-sm text-negative">{result.error}</p>}
      {result && result.ok && (
        <p className="text-sm text-positive">
          Imported {result.imported} player(s).
          {result.skipped.length > 0 && ` Skipped unmatched jersey #: ${result.skipped.join(", ")}.`}
        </p>
      )}
    </div>
  );
}
