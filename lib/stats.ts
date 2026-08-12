// Shared stat math for Practices and Games.
//
// Percentages and other derived numbers are ALWAYS computed from raw counts
// here, never stored in the database. This guarantees a percentage can never
// drift out of sync with the counts it's derived from.

export interface RawStatLine {
  zoneEntries: number;
  successfulZoneEntries: number;
  zoneExits: number;
  successfulZoneExits: number;

  goals: number;
  assists: number;
  shots: number;
  scoringChances: number;
  goodOpportunities: number;
  badOpportunities: number;

  disruptions: number;
  hits: number;
  blocks: number;
  takeaways: number;
  giveaways: number;

  shotsAgainst: number;
  goalsAgainst: number;
  saves: number;
}

export const EMPTY_STAT_LINE: RawStatLine = {
  zoneEntries: 0,
  successfulZoneEntries: 0,
  zoneExits: 0,
  successfulZoneExits: 0,
  goals: 0,
  assists: 0,
  shots: 0,
  scoringChances: 0,
  goodOpportunities: 0,
  badOpportunities: 0,
  disruptions: 0,
  hits: 0,
  blocks: 0,
  takeaways: 0,
  giveaways: 0,
  shotsAgainst: 0,
  goalsAgainst: 0,
  saves: 0,
};

/** Percentage helper. Returns null (not 0) when there's no attempt to divide by, so callers can render "—" instead of a misleading 0%. */
export function pct(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return (numerator / denominator) * 100;
}

export function formatPct(value: number | null, digits = 1): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function unsuccessfulZoneEntries(s: RawStatLine): number {
  return s.zoneEntries - s.successfulZoneEntries;
}

export function unsuccessfulZoneExits(s: RawStatLine): number {
  return s.zoneExits - s.successfulZoneExits;
}

export function zoneEntryPct(s: RawStatLine): number | null {
  return pct(s.successfulZoneEntries, s.zoneEntries);
}

export function zoneExitPct(s: RawStatLine): number | null {
  return pct(s.successfulZoneExits, s.zoneExits);
}

export function points(s: RawStatLine): number {
  return s.goals + s.assists;
}

export function savePct(s: RawStatLine): number | null {
  return pct(s.saves, s.shotsAgainst);
}

/** Sum any number of raw stat lines into one totals line. Percentages must be derived from the sum, never averaged. */
export function sumStatLines(lines: RawStatLine[]): RawStatLine {
  const total = { ...EMPTY_STAT_LINE };
  for (const line of lines) {
    for (const key of Object.keys(total) as (keyof RawStatLine)[]) {
      total[key] += line[key] ?? 0;
    }
  }
  return total;
}

/** Percentage-point / percent change between two periods of the same metric. */
export function change(current: number | null, baseline: number | null): number | null {
  if (current === null || baseline === null) return null;
  if (baseline === 0) return current === 0 ? 0 : null;
  return ((current - baseline) / Math.abs(baseline)) * 100;
}

export function formatChange(value: number | null, digits = 1): string {
  if (value === null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export const derivedCategories = {
  transition: [
    { key: "zoneEntries", label: "Zone Entries" },
    { key: "successfulZoneEntries", label: "Successful Zone Entries" },
    { key: "unsuccessfulZoneEntries", label: "Unsuccessful Zone Entries", derived: true },
    { key: "zoneEntryPct", label: "Zone Entry %", derived: true, isPct: true },
    { key: "zoneExits", label: "Zone Exits" },
    { key: "successfulZoneExits", label: "Successful Zone Exits" },
    { key: "unsuccessfulZoneExits", label: "Unsuccessful Zone Exits", derived: true },
    { key: "zoneExitPct", label: "Zone Exit %", derived: true, isPct: true },
  ],
  offense: [
    { key: "goals", label: "Goals" },
    { key: "assists", label: "Assists" },
    { key: "points", label: "Points", derived: true },
    { key: "shots", label: "Shots" },
    { key: "scoringChances", label: "Scoring Chances" },
    { key: "goodOpportunities", label: "Good Opportunities" },
    { key: "badOpportunities", label: "Bad Opportunities" },
  ],
  defense: [
    { key: "disruptions", label: "Disruptions" },
    { key: "hits", label: "Hits" },
    { key: "blocks", label: "Blocks" },
    { key: "takeaways", label: "Takeaways" },
    { key: "giveaways", label: "Giveaways" },
  ],
  goaltending: [
    { key: "shotsAgainst", label: "Shots Against" },
    { key: "goalsAgainst", label: "Goals Against" },
    { key: "saves", label: "Saves" },
    { key: "savePct", label: "Save %", derived: true, isPct: true },
  ],
} as const;

/** Get a computed value (raw or derived) off a stat line, by key, for generic table/chart rendering. */
export function getStatValue(s: RawStatLine, key: string): number | null {
  switch (key) {
    case "unsuccessfulZoneEntries":
      return unsuccessfulZoneEntries(s);
    case "unsuccessfulZoneExits":
      return unsuccessfulZoneExits(s);
    case "zoneEntryPct":
      return zoneEntryPct(s);
    case "zoneExitPct":
      return zoneExitPct(s);
    case "points":
      return points(s);
    case "savePct":
      return savePct(s);
    default:
      return (s as unknown as Record<string, number>)[key] ?? null;
  }
}
