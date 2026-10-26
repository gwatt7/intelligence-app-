// Overall Player Rankings — Version 1
//
// Two completely separate rating models, each 0-100:
//   • Skater Overall Rating (forwards + defensemen, one leaderboard)
//   • Goalie Overall Rating (goalies only)
// A goalie is never rated with the skater model and a skater never appears
// in the goalie list.
//
// This is a coaching aid built from the stats Northstar records. The
// weights below are initial, coach-adjustable judgments — they are NOT a
// scientifically validated model. Every number shown in the app is
// derived from the functions in this file, so the on-screen breakdown
// always matches the calculation.
//
// Pure, client-safe module (no database access). Data loading lives in
// lib/overall-rankings-server.ts.

import type { RawStatLine } from "@/lib/stats";

export type RankingGroup = "skaters" | "goalies";
export type RankingPeriod = "season" | "last5" | "practice";
export type PlayerPosition = "FORWARD" | "DEFENSE" | "GOALIE";
export type StatKey = keyof RawStatLine;

/** A player's totals for the period. `null` means "not recorded" — never treated as 0. */
export type StatTotals = { [K in StatKey]: number | null };

export interface PlayerSample {
  playerId: string;
  name: string;
  jerseyNumber: number;
  position: PlayerPosition;
  /** Games (or practice sessions) included. 0 = no data in this period. */
  games: number;
  totals: StatTotals | null;
}

// ---------------------------------------------------------------------------
// Configuration (initial weights and safeguards)

/** Games/sessions needed before a rating counts as a full (non-provisional) ranking. */
export const MIN_GAMES_FOR_RANKING = 3;
/** Skaters with data needed before team-relative skater scores are meaningful. */
export const MIN_SKATERS_FOR_COMPARISON = 4;
/** Shots faced needed before a goalie's save percentage is trusted. */
export const GOALIE_MIN_SHOTS: Record<RankingPeriod, number> = { season: 50, last5: 50, practice: 30 };
/** Minimum share of a player's category weight that must have data, else the rating is provisional. */
export const MIN_WEIGHT_COVERAGE = 0.5;

type Weights = Record<string, number>;

/** Skater weights by position. Each set sums to 1. */
export const SKATER_WEIGHTS: Record<"FORWARD" | "DEFENSE", Weights> = {
  FORWARD: {
    production: 0.22,
    generation: 0.13,
    quality: 0.08,
    entries: 0.12,
    exits: 0.1,
    possession: 0.15,
    defense: 0.12,
    faceoffs: 0.08,
  },
  DEFENSE: {
    production: 0.16,
    generation: 0.1,
    quality: 0.06,
    entries: 0.1,
    exits: 0.16,
    possession: 0.18,
    defense: 0.24,
  },
};

/** Goalie weights. Sums to 1. Freezes are intentionally not used; wins/losses are shown for context only. */
export const GOALIE_WEIGHTS: Weights = {
  savePct: 0.5,
  kills: 0.35,
  goalsAgainst: 0.15,
};

// ---------------------------------------------------------------------------
// Category definitions

type Raw = { num: number; den: number };

interface CategoryDef {
  key: string;
  label: string;
  /** Why the category is in the rating (shown in the methodology panel). */
  why: string;
  /** How it is measured. */
  measure: string;
  /** Numerator/denominator from the player's totals, or null when not recorded / no attempts. */
  raw: (t: StatTotals, games: number) => Raw | null;
  /** Prior added for small samples: `k` units of the comparison-group average (or a fixed value). */
  shrink: { k: number; toward?: number };
  /** Human-readable underlying stats. */
  detail: (t: StatTotals, games: number) => string;
  format: (v: number) => string;
  /** Shown when the player has games but this category can't be scored. */
  missing: string;
}

const per = (n: number) => n.toFixed(2);
const pctText = (v: number) => `${(v * 100).toFixed(1)}%`;
const has = (...vals: (number | null)[]) => vals.every((v) => v !== null);
const n = (v: number | null) => (v === null ? "not recorded" : String(v));
/** "12 blocks · 4 hits" — only the stats that were recorded. */
const recorded = (parts: [number | null, string][]) =>
  parts.filter(([v]) => v !== null).map(([v, label]) => `${v} ${label}`).join(" · ");

export const SKATER_CATEGORIES: CategoryDef[] = [
  {
    key: "production",
    missing: "Not recorded in this period",
    label: "Point Production",
    why: "Goals and assists are the clearest measure of offensive impact. Points are counted once here (goals are not added again elsewhere).",
    measure: "Points (goals + assists) per game",
    raw: (t, g) => (has(t.goals, t.assists) && g > 0 ? { num: t.goals! + t.assists!, den: g } : null),
    shrink: { k: 2 },
    detail: (t, g) => `${n(t.goals)} G · ${n(t.assists)} A in ${g} GP`,
    format: (v) => `${per(v)} pts/game`,
  },
  {
    key: "generation",
    missing: "Not recorded in this period",
    label: "Shot & Chance Generation",
    why: "Creating chances drives future scoring. Shots are half-weighted because many shots are already counted as scoring chances.",
    measure: "(Scoring chances + ½ × shots) per game",
    raw: (t, g) => {
      if (g <= 0 || (t.scoringChances === null && t.shots === null)) return null;
      return { num: (t.scoringChances ?? 0) + 0.5 * (t.shots ?? 0), den: g };
    },
    shrink: { k: 2 },
    detail: (t, g) => `${recorded([[t.scoringChances, "scoring chances"], [t.shots, "shots"]])} in ${g} GP`,
    format: (v) => `${per(v)} /game`,
  },
  {
    key: "quality",
    missing: "No opportunities recorded",
    label: "Opportunity Quality",
    why: "Rewards choosing good opportunities over bad ones (the app's Good / Bad Opportunities counts).",
    measure: "Good ÷ (good + bad) opportunities",
    raw: (t) => (has(t.goodOpportunities, t.badOpportunities) && t.goodOpportunities! + t.badOpportunities! > 0
      ? { num: t.goodOpportunities!, den: t.goodOpportunities! + t.badOpportunities! }
      : null),
    shrink: { k: 10 },
    detail: (t) => `${n(t.goodOpportunities)} good · ${n(t.badOpportunities)} bad`,
    format: pctText,
  },
  {
    key: "entries",
    missing: "No zone entries recorded",
    label: "Zone Entries",
    why: "Successful entries carry the puck into the offensive zone; unsuccessful ones count against the percentage.",
    measure: "Successful ÷ attempted zone entries",
    raw: (t) => (has(t.zoneEntries, t.successfulZoneEntries) && t.zoneEntries! > 0
      ? { num: t.successfulZoneEntries!, den: t.zoneEntries! }
      : null),
    shrink: { k: 10 },
    detail: (t) => `${n(t.successfulZoneEntries)} of ${n(t.zoneEntries)} successful`,
    format: pctText,
  },
  {
    key: "exits",
    missing: "No zone exits recorded",
    label: "Zone Exits",
    why: "Clean exits get the team out of its own zone; failed exits count against the percentage.",
    measure: "Successful ÷ attempted zone exits",
    raw: (t) => (has(t.zoneExits, t.successfulZoneExits) && t.zoneExits! > 0
      ? { num: t.successfulZoneExits!, den: t.zoneExits! }
      : null),
    shrink: { k: 10 },
    detail: (t) => `${n(t.successfulZoneExits)} of ${n(t.zoneExits)} successful`,
    format: pctText,
  },
  {
    key: "possession",
    missing: "Not recorded in this period",
    label: "Puck Management",
    why: "Takeaways win the puck back; giveaways lose it. Using the net count rewards both and penalizes turnovers.",
    measure: "(Takeaways − giveaways) per game",
    raw: (t, g) => (has(t.takeaways, t.giveaways) && g > 0 ? { num: t.takeaways! - t.giveaways!, den: g } : null),
    shrink: { k: 2 },
    detail: (t, g) => `${n(t.takeaways)} takeaways · ${n(t.giveaways)} giveaways in ${g} GP`,
    format: (v) => `${v >= 0 ? "+" : ""}${per(v)} /game`,
  },
  {
    key: "defense",
    missing: "Not recorded in this period",
    label: "Defensive & Physical",
    why: "Disruptions, blocked shots and hits capture defensive work that doesn't show up on the scoresheet.",
    measure: "(Disruptions + blocks + hits) per game",
    raw: (t, g) => {
      if (g <= 0 || (t.disruptions === null && t.blocks === null && t.hits === null)) return null;
      return { num: (t.disruptions ?? 0) + (t.blocks ?? 0) + (t.hits ?? 0), den: g };
    },
    shrink: { k: 2 },
    detail: (t, g) => `${recorded([[t.disruptions, "disruptions"], [t.blocks, "blocks"], [t.hits, "hits"]])} in ${g} GP`,
    format: (v) => `${per(v)} /game`,
  },
  {
    key: "faceoffs",
    missing: "No faceoffs taken",
    label: "Faceoffs",
    why: "Winning draws starts possession. Forwards only (the app records faceoffs for forwards).",
    measure: "Faceoffs won ÷ taken",
    raw: (t) => (has(t.faceoffsWon, t.faceoffsLost) && t.faceoffsWon! + t.faceoffsLost! > 0
      ? { num: t.faceoffsWon!, den: t.faceoffsWon! + t.faceoffsLost! }
      : null),
    shrink: { k: 20, toward: 0.5 },
    detail: (t) => `${n(t.faceoffsWon)} won · ${n(t.faceoffsLost)} lost`,
    format: pctText,
  },
];

export const GOALIE_CATEGORIES: CategoryDef[] = [
  {
    key: "savePct",
    missing: "No shots faced recorded",
    label: "Save Percentage",
    why: "The most direct measure of a goalie's own performance, independent of team scoring.",
    measure: "Saves ÷ shots against (scaled .860 → 0, .940 → 100)",
    raw: (t) => (has(t.saves, t.shotsAgainst) && t.shotsAgainst! > 0 ? { num: t.saves!, den: t.shotsAgainst! } : null),
    shrink: { k: 60, toward: 0.9 },
    detail: (t) => `${n(t.saves)} saves on ${n(t.shotsAgainst)} shots`,
    format: (v) => v.toFixed(3).replace(/^0/, ""),
  },
  {
    key: "kills",
    missing: "Not recorded in this period",
    label: "Kills",
    why: "Kills are the staff's key goalie stat. Scored against the goalie group's average (50 = average, 100 = twice the average).",
    measure: "Kills per game",
    raw: (t, g) => (t.kills !== null && g > 0 ? { num: t.kills, den: g } : null),
    shrink: { k: 2 },
    detail: (t, g) => `${n(t.kills)} kills in ${g} GP`,
    format: (v) => `${per(v)} /game`,
  },
  {
    key: "goalsAgainst",
    missing: "Not recorded in this period",
    label: "Goals Against",
    why: "Goals allowed per game. Low weight because it also depends on the defense in front of the goalie (scaled 5.0 → 0, 1.5 → 100).",
    measure: "Goals against per game",
    raw: (t, g) => (t.goalsAgainst !== null && t.shotsAgainst !== null && g > 0 ? { num: t.goalsAgainst, den: g } : null),
    shrink: { k: 2, toward: 3 },
    detail: (t, g) => `${n(t.goalsAgainst)} goals against in ${g} GP`,
    format: (v) => `${per(v)} /game`,
  },
];

// ---------------------------------------------------------------------------
// Scoring

/** Standard normal CDF (Abramowitz–Stegun approximation). */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export interface CategoryResult {
  key: string;
  label: string;
  /** Underlying stats, e.g. "8 G · 9 A in 20 GP". */
  detail: string;
  /** Player's actual (unadjusted) value, formatted. */
  value: string | null;
  /** Value after the small-sample adjustment, formatted. */
  adjusted: string | null;
  /** 0-100 category score, or null when the data isn't recorded. */
  score: number | null;
  /** Configured weight for this player's position. */
  weight: number;
  /** Share of the overall rating after missing categories are excluded (0-1). */
  effectiveWeight: number;
  /** Points this category moves the rating above (+) or below (−) 50. */
  contribution: number;
  missingReason: string | null;
}

export type RatingStatus = "ranked" | "provisional" | "unrated";

export interface PlayerRating {
  playerId: string;
  name: string;
  jerseyNumber: number;
  position: PlayerPosition;
  games: number;
  rating: number | null;
  status: RatingStatus;
  /** Why the rating is provisional / unrated. */
  reasons: string[];
  rank: number | null;
  movement: number | null;
  strongest: string | null;
  weakest: string | null;
  categories: CategoryResult[];
  /** Share of category weight that had data (0-1). */
  coverage: number;
  /** Extra sample-size info, e.g. shots faced. */
  sampleNote: string;
  /** Context-only stats (not in the rating), e.g. goalie W-L. */
  context: string | null;
}

export interface RankingResult {
  group: RankingGroup;
  players: PlayerRating[];
  /** Categories nobody had data for in this period ("not tracked"). */
  untracked: string[];
  notes: string[];
}

/**
 * Stats that are 0 for every player in the period are treated as "not
 * tracked" (null) rather than as a real zero, so an unused stat column
 * never drags anyone's rating down.
 */
function markUntracked(samples: PlayerSample[], keys: StatKey[]): { samples: PlayerSample[]; untrackedKeys: StatKey[] } {
  const withData = samples.filter((s) => s.totals && s.games > 0);
  if (withData.length === 0) return { samples, untrackedKeys: [] };
  const untrackedKeys = keys.filter((k) => withData.every((s) => !s.totals![k]));
  if (untrackedKeys.length === 0) return { samples, untrackedKeys };
  return {
    untrackedKeys,
    samples: samples.map((s) =>
      s.totals ? { ...s, totals: { ...s.totals, ...Object.fromEntries(untrackedKeys.map((k) => [k, null])) } as StatTotals } : s
    ),
  };
}

const SKATER_KEYS: StatKey[] = [
  "goals", "assists", "shots", "scoringChances", "goodOpportunities", "badOpportunities", "zoneEntries",
  "successfulZoneEntries", "zoneExits", "successfulZoneExits", "takeaways", "giveaways", "disruptions",
  "blocks", "hits", "faceoffsWon", "faceoffsLost",
];
const GOALIE_KEYS: StatKey[] = ["saves", "shotsAgainst", "goalsAgainst", "kills"];

interface Scored {
  sample: PlayerSample;
  raws: Map<string, Raw | null>;
}

/** Converts each player's category values into 0-100 scores. */
function scoreCategories(
  scored: Scored[],
  defs: CategoryDef[],
  mode: "skater" | "goalie",
  eligibleFor: (s: PlayerSample, key: string) => boolean
): Map<string, Map<string, { score: number; adjusted: number; value: number }>> {
  const out = new Map<string, Map<string, { score: number; adjusted: number; value: number }>>();
  for (const s of scored) out.set(s.sample.playerId, new Map());

  for (const def of defs) {
    const group = scored.filter((s) => eligibleFor(s.sample, def.key) && s.raws.get(def.key));
    if (group.length === 0) continue;
    const pooled = group.reduce((a, s) => a + s.raws.get(def.key)!.num, 0) / group.reduce((a, s) => a + s.raws.get(def.key)!.den, 0);
    const prior = def.shrink.toward ?? pooled;
    const adjusted = group.map((s) => {
      const r = s.raws.get(def.key)!;
      return { s, value: r.num / r.den, adj: (r.num + def.shrink.k * prior) / (r.den + def.shrink.k) };
    });

    let scoreOf: (adj: number) => number;
    if (mode === "skater") {
      // Team-relative: 50 = average of the skaters compared, via a z-score → percentile.
      const mean = adjusted.reduce((a, x) => a + x.adj, 0) / adjusted.length;
      const sd = Math.sqrt(adjusted.reduce((a, x) => a + (x.adj - mean) ** 2, 0) / adjusted.length);
      scoreOf = (adj) => (adjusted.length < 2 || sd < 1e-9 ? 50 : 100 * normalCdf((adj - mean) / sd));
    } else if (def.key === "savePct") {
      scoreOf = (adj) => clamp(((adj - 0.86) / 0.08) * 100);
    } else if (def.key === "goalsAgainst") {
      scoreOf = (adj) => clamp(((5 - adj) / 3.5) * 100);
    } else {
      // Kills: ratio to the goalie group's average (no external benchmark exists).
      scoreOf = (adj) => (pooled <= 0 ? 50 : clamp((50 * adj) / pooled));
    }

    for (const x of adjusted) out.get(x.s.sample.playerId)!.set(def.key, { score: round1(scoreOf(x.adj)), adjusted: x.adj, value: x.value });
  }
  return out;
}

/** Computes one leaderboard (skaters or goalies) for one period. */
export function computeRankings(group: RankingGroup, period: RankingPeriod, allSamples: PlayerSample[]): RankingResult {
  const isGoalie = group === "goalies";
  const pool = allSamples.filter((s) => (isGoalie ? s.position === "GOALIE" : s.position !== "GOALIE"));
  const defs = isGoalie ? GOALIE_CATEGORIES : SKATER_CATEGORIES;
  const { samples, untrackedKeys } = markUntracked(pool, isGoalie ? GOALIE_KEYS : SKATER_KEYS);

  const weightsFor = (p: PlayerPosition): Weights => (isGoalie ? GOALIE_WEIGHTS : SKATER_WEIGHTS[p === "DEFENSE" ? "DEFENSE" : "FORWARD"]);

  const scored: Scored[] = samples.map((sample) => ({
    sample,
    raws: new Map(defs.map((d) => [d.key, sample.totals && sample.games > 0 ? d.raw(sample.totals, sample.games) : null])),
  }));
  const eligible = (s: PlayerSample, key: string) => s.games > 0 && key in weightsFor(s.position);
  const scores = scoreCategories(scored, defs, isGoalie ? "goalie" : "skater", eligible);

  const withData = scored.filter((s) => s.sample.games > 0);
  const notes: string[] = [];
  const tooFewToCompare = !isGoalie && withData.length < MIN_SKATERS_FOR_COMPARISON;
  if (tooFewToCompare && withData.length > 0) {
    notes.push(`Only ${withData.length} skater(s) have data in this period. Team-relative scores need at least ${MIN_SKATERS_FOR_COMPARISON}, so every rating is provisional.`);
  }
  if (isGoalie && withData.length === 1) {
    notes.push("Only one goalie has data in this period, so the Kills score (which compares goalies) is 50 by default.");
  }

  const players: PlayerRating[] = scored.map(({ sample }) => {
    const weights = weightsFor(sample.position);
    const own = scores.get(sample.playerId)!;
    const defsForPlayer = defs.filter((d) => d.key in weights);
    const totalWeight = defsForPlayer.reduce((a, d) => a + weights[d.key], 0);
    const availableWeight = defsForPlayer.filter((d) => own.has(d.key)).reduce((a, d) => a + weights[d.key], 0);
    const coverage = totalWeight > 0 ? availableWeight / totalWeight : 0;

    const categories: CategoryResult[] = defsForPlayer.map((d) => {
      const sc = own.get(d.key);
      const effectiveWeight = sc && availableWeight > 0 ? weights[d.key] / availableWeight : 0;
      const missingReason = sc ? null : sample.games === 0 || !sample.totals ? "No data in this period" : d.missing;
      return {
        key: d.key,
        label: d.label,
        detail: sample.totals && sample.games > 0 && d.raw(sample.totals, sample.games) ? d.detail(sample.totals, sample.games) : "—",
        value: sc ? d.format(sc.value) : null,
        adjusted: sc ? d.format(sc.adjusted) : null,
        score: sc ? sc.score : null,
        weight: weights[d.key],
        effectiveWeight,
        contribution: sc ? round1(effectiveWeight * (sc.score - 50)) : 0,
        missingReason,
      };
    });

    const rated = categories.filter((c) => c.score !== null);
    const rating = rated.length > 0 ? round1(rated.reduce((a, c) => a + c.effectiveWeight * c.score!, 0)) : null;

    const reasons: string[] = [];
    let status: RatingStatus = "ranked";
    if (sample.games === 0 || rating === null) {
      status = "unrated";
      reasons.push(sample.games === 0 ? "No games recorded in this period yet" : "None of the rated stats are recorded yet");
    } else {
      if (sample.games < MIN_GAMES_FOR_RANKING) reasons.push(`Only ${sample.games} of ${MIN_GAMES_FOR_RANKING} games needed`);
      if (coverage < MIN_WEIGHT_COVERAGE) reasons.push(`Only ${Math.round(coverage * 100)}% of rating categories have data`);
      if (tooFewToCompare) reasons.push(`Fewer than ${MIN_SKATERS_FOR_COMPARISON} skaters to compare against`);
      if (isGoalie) {
        const shots = sample.totals?.shotsAgainst ?? null;
        if (shots === null || shots < GOALIE_MIN_SHOTS[period]) reasons.push(`${shots ?? 0} of ${GOALIE_MIN_SHOTS[period]} shots faced needed`);
      }
      if (reasons.length > 0) status = "provisional";
    }

    const ordered = [...rated].sort((a, b) => b.score! - a.score!);
    const shots = sample.totals?.shotsAgainst;
    const unit = period === "practice" ? "session" : "game";
    const sampleNote = isGoalie
      ? `${sample.games} ${unit}${sample.games === 1 ? "" : "s"}${shots != null ? ` · ${shots} shots faced` : ""}`
      : `${sample.games} ${unit}${sample.games === 1 ? "" : "s"}`;
    const w = sample.totals?.wins, l = sample.totals?.losses;
    const context = isGoalie && w != null && l != null && w + l > 0 ? `${w}-${l} record (not part of the rating)` : null;

    return {
      playerId: sample.playerId,
      name: sample.name,
      jerseyNumber: sample.jerseyNumber,
      position: sample.position,
      games: sample.games,
      rating,
      status,
      reasons,
      rank: null,
      movement: null,
      strongest: ordered.length >= 2 ? ordered[0].label : null,
      weakest: ordered.length >= 2 ? ordered[ordered.length - 1].label : null,
      categories,
      coverage,
      sampleNote,
      context,
    };
  });

  const order = { ranked: 0, provisional: 1, unrated: 2 } as const;
  players.sort(
    (a, b) => order[a.status] - order[b.status] || (b.rating ?? -1) - (a.rating ?? -1) || b.games - a.games || a.jerseyNumber - b.jerseyNumber
  );
  let r = 0;
  for (const p of players) if (p.status === "ranked") p.rank = ++r;

  const labelOf = (k: StatKey) => k.replace(/([A-Z])/g, " $1").toLowerCase();
  return { group, players, untracked: untrackedKeys.map(labelOf), notes };
}

/** Adds rank movement versus an earlier snapshot of the same leaderboard (only between two full rankings). */
export function applyMovement(current: RankingResult, previous: RankingResult | null): RankingResult {
  if (!previous) return current;
  const before = new Map(previous.players.filter((p) => p.rank !== null).map((p) => [p.playerId, p.rank!]));
  return {
    ...current,
    players: current.players.map((p) => (p.rank !== null && before.has(p.playerId) ? { ...p, movement: before.get(p.playerId)! - p.rank } : p)),
  };
}

export const PERIOD_LABEL: Record<RankingPeriod, string> = {
  season: "Season",
  last5: "Last 5 Games",
  practice: "Practice",
};
