// Display-only summaries for the dashboard, derived from data the app
// already stores (Game results, PlayerSeasonStat report cards). Nothing here
// writes data or changes any existing calculation.

export interface ScheduleGame {
  id: string;
  opponent: string;
  date: Date;
  homeAway: "HOME" | "AWAY" | "NEUTRAL";
  gameType: "PRESEASON" | "REGULAR_SEASON" | "PLAYOFFS";
  timeTBA: boolean;
  arena: string | null;
  city: string | null;
  state: string | null;
  location: string | null;
  tournamentName: string | null;
  isCompleted: boolean;
  ourScore: number | null;
  opponentScore: number | null;
}

type Result = "W" | "L" | "T";

function resultOf(g: ScheduleGame): Result | null {
  if (!g.isCompleted || g.ourScore === null || g.opponentScore === null) return null;
  return g.ourScore > g.opponentScore ? "W" : g.ourScore < g.opponentScore ? "L" : "T";
}

/** Win-loss-tie record from completed games, e.g. "3-1-0". */
export function seasonRecord(games: ScheduleGame[]): string {
  let w = 0, l = 0, t = 0;
  for (const g of games) {
    const r = resultOf(g);
    if (r === "W") w++;
    else if (r === "L") l++;
    else if (r === "T") t++;
  }
  return `${w}-${l}-${t}`;
}

/** Current streak from the most recent completed games, e.g. "W3"; null when none played. */
export function currentStreak(games: ScheduleGame[]): string | null {
  const results = games
    .filter((g) => resultOf(g) !== null)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((g) => resultOf(g)!);
  if (results.length === 0) return null;
  let n = 0;
  while (n < results.length && results[n] === results[0]) n++;
  return `${results[0]}${n}`;
}

/** The home rink, taken from the season's home games. */
export function homeArena(games: ScheduleGame[]): string | null {
  const counts = new Map<string, number>();
  for (const g of games) if (g.homeAway === "HOME" && g.arena) counts.set(g.arena, (counts.get(g.arena) ?? 0) + 1);
  let best: string | null = null;
  for (const [arena, n] of counts) if (!best || n > counts.get(best)!) best = arena;
  return best;
}

// ---------------------------------------------------------------------------
// Last-season team leaders (from the imported report cards)

export interface ReportCardRow {
  playerId: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  heroImageUrl: string | null;
  heroImageFocalX: number | null;
  heroImageFocalY: number | null;
  gamesPlayed: number | null;
  goals: number | null;
  assists: number | null;
  shots: number | null;
  plusMinus: number | null;
  blocks: number | null;
}

export function reportCardPoints(r: ReportCardRow): number | null {
  return r.goals === null && r.assists === null ? null : (r.goals ?? 0) + (r.assists ?? 0);
}

export interface Leader {
  label: string;
  value: string;
  holders: { playerId: string; label: string }[];
}

function holderLabel(r: ReportCardRow): string {
  return `#${r.jerseyNumber} ${r.firstName.charAt(0)}. ${r.lastName}`;
}

/** Leader (with ties) for one stat; null when nobody has a value. */
function leaderFor(rows: ReportCardRow[], label: string, get: (r: ReportCardRow) => number | null, signed = false): Leader | null {
  const valued = rows.map((r) => ({ r, v: get(r) })).filter((x): x is { r: ReportCardRow; v: number } => x.v !== null);
  if (valued.length === 0) return null;
  const max = Math.max(...valued.map((x) => x.v));
  const top = valued.filter((x) => x.v === max).sort((a, b) => a.r.jerseyNumber - b.r.jerseyNumber);
  return {
    label,
    value: signed && max > 0 ? `+${max}` : String(max),
    holders: top.map((x) => ({ playerId: x.r.playerId, label: holderLabel(x.r) })),
  };
}

export function teamLeaders(rows: ReportCardRow[]): (Leader | null)[] {
  return [
    leaderFor(rows, "Points", reportCardPoints),
    leaderFor(rows, "Goals", (r) => r.goals),
    leaderFor(rows, "Assists", (r) => r.assists),
    leaderFor(rows, "Plus / Minus", (r) => r.plusMinus, true),
    leaderFor(rows, "Blocked Shots", (r) => r.blocks),
  ];
}

/** Points leader (ties broken by goals, then jersey number). */
export function pointsLeader(rows: ReportCardRow[]): ReportCardRow | null {
  const sorted = rows
    .filter((r) => reportCardPoints(r) !== null)
    .sort(
      (a, b) =>
        reportCardPoints(b)! - reportCardPoints(a)! || (b.goals ?? 0) - (a.goals ?? 0) || a.jerseyNumber - b.jerseyNumber
    );
  return sorted[0] ?? null;
}

/** Player Spotlight: a player who has an action photo (hero image), else the points leader. */
export function spotlightPlayer(rows: ReportCardRow[]): ReportCardRow | null {
  const withPhoto = rows.filter((r) => r.heroImageUrl);
  return pointsLeader(withPhoto) ?? withPhoto[0] ?? pointsLeader(rows);
}
