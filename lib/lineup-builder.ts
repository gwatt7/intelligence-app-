// Lineup Builder — picks 4 forward lines (LW–C–RW), 3 defense pairs (LD–RD)
// and a starting goalie from everything logged in the app.
//
// Pure functions only (no database access); lib/lineup-builder-server.ts
// loads the data. The approach:
//   1. Rate every skater 0–100 in a few areas (scoring, playmaking, defense,
//      physical, transition, faceoffs) from per-game rates, ranked against
//      teammates in the same group (forwards vs defense). This season's
//      games count most, recent games a little more; last season's report
//      card fills in early on and fades out as games are logged.
//   2. Give each player a style ("Sniper", "Shutdown D", ...).
//   3. Leave out anyone injured/unavailable or scratched/injured for the
//      next game, and favour players who actually dress regularly.
//   4. Search for the lineup with the best total: player value in each slot
//      (position + handedness fit) weighted by line, plus line chemistry
//      (shooter + playmaker, a defensively responsible player, faceoffs, a
//      puck-mover with a stay-at-home D). Several distinct strong lineups
//      are kept so a coach can flip to another option.

import type { RawStatLine } from "./stats";
import type { SpecificPosition } from "./positions";

// ---------------------------------------------------------------------------
// Input types

export interface LineupGameLine {
  /** Oldest first. */
  stat: RawStatLine;
  untrackedFields: readonly string[];
}

export interface LastSeasonLine {
  gamesPlayed: number | null;
  goals: number | null;
  assists: number | null;
  shots: number | null;
  takeaways: number | null;
  giveaways: number | null;
  hits: number | null;
  blocks: number | null;
  plusMinus: number | null;
  faceoffWinPct: number | null;
}

export interface LineupPlayerInput {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: "FORWARD" | "DEFENSE" | "GOALIE";
  primaryPosition: SpecificPosition | null;
  secondaryPosition: SpecificPosition | null;
  shoots: "LEFT" | "RIGHT" | null;
  status: "ACTIVE" | "INJURED" | "UNAVAILABLE";
  /** This season's played games for this player (dressed only), oldest first. */
  games: LineupGameLine[];
  /** All-situation goals/assists this season (5v5 + PP + PK). */
  seasonGoals: number;
  seasonAssists: number;
  seasonPlusMinus: number;
  /** Games this player was scratched / injured this season. */
  gamesScratched: number;
  gamesInjured: number;
  /** Explicit status for the next game, if the coach set one. */
  nextGameStatus: "SCRATCHED" | "INJURED" | null;
  lastSeason: LastSeasonLine | null;
}

export interface LineupInput {
  players: LineupPlayerInput[];
  /** Season games that have been played so far. */
  teamGamesPlayed: number;
}

// ---------------------------------------------------------------------------
// Output types

export type Style =
  | "Sniper"
  | "Playmaker"
  | "Two-Way Forward"
  | "Power Forward"
  | "Grinder"
  | "Offensive D"
  | "Shutdown D"
  | "Physical D"
  | "Two-Way D"
  | "Goalie";

export interface PlayerRatings {
  scoring: number;
  playmaking: number;
  defense: number;
  physical: number;
  transition: number;
  faceoff: number | null;
  overall: number;
}

export interface RatedPlayer {
  id: string;
  name: string;
  jerseyNumber: number;
  group: "F" | "D" | "G";
  slots: SpecificPosition[]; // primary first
  positionSet: boolean;
  shoots: "LEFT" | "RIGHT" | null;
  ratings: PlayerRatings;
  style: Style;
  /** Overall adjusted for how regularly the player dresses. */
  value: number;
  gamesThisSeason: number;
  dressRate: number | null;
  hasData: boolean;
  usedLastSeason: boolean;
  statLine: string;
  /** Goalies only. */
  savePct: number | null;
}

export interface SlotAssignment {
  slot: SpecificPosition;
  player: RatedPlayer | null;
  fit: number;
  note: string | null; // e.g. "Off-wing", "Playing secondary position"
}

export interface ForwardLine {
  number: number;
  lw: SlotAssignment;
  c: SlotAssignment;
  rw: SlotAssignment;
  notes: string[];
  rating: number;
}

export interface DefensePair {
  number: number;
  ld: SlotAssignment;
  rd: SlotAssignment;
  notes: string[];
  rating: number;
}

export interface LineupOption {
  forwards: ForwardLine[];
  defense: DefensePair[];
  extras: RatedPlayer[];
  score: number;
}

export interface OutPlayer {
  player: RatedPlayer;
  reason: string;
}

export interface LineupResult {
  options: LineupOption[];
  goalies: { starter: RatedPlayer | null; backup: RatedPlayer | null; others: RatedPlayer[] };
  out: OutPlayer[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Ratings

const F_SLOTS: SpecificPosition[] = ["C", "LW", "RW"];
const D_SLOTS: SpecificPosition[] = ["LD", "RD"];

/** Recent games count a bit more: newest 1.0, each older game ×0.9, floor 0.4. */
function recencyWeights(n: number): number[] {
  return Array.from({ length: n }, (_, i) => Math.max(0.4, Math.pow(0.9, n - 1 - i)));
}

/** Weighted per-game rate of a sum of fields, skipping games where any of them wasn't tracked. */
function weightedRate(games: LineupGameLine[], w: number[], keys: (keyof RawStatLine)[]): { rate: number; weight: number } {
  let sum = 0;
  let weight = 0;
  games.forEach((g, i) => {
    if (keys.some((k) => g.untrackedFields.includes(k))) return;
    sum += keys.reduce((a, k) => a + g.stat[k], 0) * w[i];
    weight += w[i];
  });
  return { rate: weight ? sum / weight : 0, weight };
}

/** Weighted ratio (e.g. successful entries / entries), or null with no attempts. */
function weightedPct(games: LineupGameLine[], w: number[], num: (keyof RawStatLine)[], den: (keyof RawStatLine)[]): { pct: number | null; attempts: number } {
  let n = 0;
  let d = 0;
  let attempts = 0;
  games.forEach((g, i) => {
    if ([...num, ...den].some((k) => g.untrackedFields.includes(k))) return;
    const dv = den.reduce((a, k) => a + g.stat[k], 0);
    n += num.reduce((a, k) => a + g.stat[k], 0) * w[i];
    d += dv * w[i];
    attempts += dv;
  });
  return { pct: d > 0 ? (n / d) * 100 : null, attempts };
}

/** Last season's report card counts as up to this many games of evidence. */
const LAST_SEASON_PRIOR_GAMES = 4;

interface RawMetrics {
  goals: number | null;
  assists: number | null;
  shots: number | null;
  takeaways: number | null;
  giveaways: number | null;
  hits: number | null;
  blocks: number | null;
  plusMinus: number | null;
  entryPct: number | null;
  exitPct: number | null;
  faceoffPct: number | null;
  evidence: number; // weighted games of data
  usedLastSeason: boolean;
}

function blend(cur: number | null, curWeight: number, last: number | null, lastWeight: number): number | null {
  const parts: [number, number][] = [];
  if (cur !== null && curWeight > 0) parts.push([cur, curWeight]);
  if (last !== null && lastWeight > 0) parts.push([last, lastWeight]);
  if (!parts.length) return null;
  const w = parts.reduce((a, [, x]) => a + x, 0);
  return parts.reduce((a, [v, x]) => a + v * x, 0) / w;
}

function rawMetrics(p: LineupPlayerInput): RawMetrics {
  const games = p.games;
  const w = recencyWeights(games.length);
  const wsum = w.reduce((a, b) => a + b, 0);
  const gp = games.length;

  // Season scoring totals include PP/PK, so use them as plain per-game rates.
  const cur = {
    goals: gp ? p.seasonGoals / gp : null,
    assists: gp ? p.seasonAssists / gp : null,
    plusMinus: gp ? p.seasonPlusMinus / gp : null,
    shots: gp ? weightedRate(games, w, ["shots"]).rate : null,
    takeaways: gp ? weightedRate(games, w, ["takeaways", "disruptions"]).rate : null,
    giveaways: gp ? weightedRate(games, w, ["giveaways"]).rate : null,
    hits: gp ? weightedRate(games, w, ["hits"]).rate : null,
    blocks: gp ? weightedRate(games, w, ["blocks"]).rate : null,
  };
  const entry = weightedPct(games, w, ["successfulZoneEntries"], ["zoneEntries"]);
  const exit = weightedPct(games, w, ["successfulZoneExits"], ["zoneExits"]);
  const fo = weightedPct(games, w, ["faceoffsWon"], ["faceoffsWon", "faceoffsLost"]);

  const ls = p.lastSeason;
  const lgp = ls?.gamesPlayed ?? 0;
  const lastW = lgp > 0 ? Math.min(lgp, LAST_SEASON_PRIOR_GAMES) : 0;
  const per = (v: number | null | undefined) => (lgp > 0 && v !== null && v !== undefined ? v / lgp : null);

  return {
    goals: blend(cur.goals, wsum, per(ls?.goals), lastW),
    assists: blend(cur.assists, wsum, per(ls?.assists), lastW),
    shots: blend(cur.shots, wsum, per(ls?.shots), lastW),
    takeaways: blend(cur.takeaways, wsum, per(ls?.takeaways), lastW),
    giveaways: blend(cur.giveaways, wsum, per(ls?.giveaways), lastW),
    hits: blend(cur.hits, wsum, per(ls?.hits), lastW),
    blocks: blend(cur.blocks, wsum, per(ls?.blocks), lastW),
    plusMinus: blend(cur.plusMinus, wsum, per(ls?.plusMinus), lastW),
    entryPct: entry.attempts >= 3 ? entry.pct : null,
    exitPct: exit.attempts >= 3 ? exit.pct : null,
    faceoffPct:
      fo.attempts >= 10
        ? blend(fo.pct, fo.attempts, ls?.faceoffWinPct ?? null, lgp > 0 ? 20 : 0)
        : lgp > 0 && ls?.faceoffWinPct != null
          ? ls.faceoffWinPct
          : null,
    evidence: wsum + lastW,
    usedLastSeason: lastW > 0,
  };
}

/** Percentile (0–100) of `value` among `pool`; null values sit at the middle. */
function percentile(value: number | null, pool: (number | null)[], higherIsBetter = true): number {
  const vals = pool.filter((v): v is number => v !== null);
  if (value === null || vals.length < 2) return 50;
  let below = 0;
  let equal = 0;
  for (const v of vals) {
    if (higherIsBetter ? v < value : v > value) below++;
    else if (v === value) equal++;
  }
  return ((below + (equal - 1) / 2) / (vals.length - 1)) * 100;
}

/** Pulls a rating toward 50 when there's little evidence behind it. */
function shrink(rating: number, evidence: number): number {
  const trust = evidence / (evidence + 2);
  return 50 + (rating - 50) * trust;
}

function groupOf(p: LineupPlayerInput): "F" | "D" | "G" {
  const pos = p.primaryPosition;
  if (pos === "G" || (!pos && p.position === "GOALIE")) return "G";
  if (pos === "LD" || pos === "RD" || (!pos && p.position === "DEFENSE")) return "D";
  return "F";
}

/** Slots a player can fill, primary first. Unset positions fall back to the broad position and shooting hand. */
function slotsOf(p: LineupPlayerInput, group: "F" | "D" | "G"): SpecificPosition[] {
  const slots: SpecificPosition[] = [];
  if (p.primaryPosition) slots.push(p.primaryPosition);
  else if (group === "F") slots.push(p.shoots === "RIGHT" ? "RW" : "LW");
  else if (group === "D") slots.push(p.shoots === "RIGHT" ? "RD" : "LD");
  else slots.push("G");
  if (p.secondaryPosition && !slots.includes(p.secondaryPosition)) slots.push(p.secondaryPosition);
  return slots;
}

function styleOf(group: "F" | "D" | "G", r: PlayerRatings): Style {
  if (group === "G") return "Goalie";
  const { scoring, playmaking, defense, physical } = r;
  if (group === "D") {
    const offense = (scoring + playmaking) / 2;
    if (offense >= 60 && offense - defense >= 8) return "Offensive D";
    if (physical >= 65 && physical >= defense) return "Physical D";
    if (defense >= 55 && defense - offense >= 8) return "Shutdown D";
    return "Two-Way D";
  }
  if (physical >= 65 && scoring >= 55) return "Power Forward";
  if (scoring >= 60 && scoring >= playmaking) return "Sniper";
  if (playmaking >= 60) return "Playmaker";
  if (physical >= 60 && physical > Math.max(scoring, playmaking)) return "Grinder";
  if (defense >= 55) return "Two-Way Forward";
  return scoring >= playmaking ? "Sniper" : "Playmaker";
}

function statLineOf(p: LineupPlayerInput, group: "F" | "D" | "G"): string {
  const gp = p.games.length;
  if (group === "G") {
    const saves = p.games.reduce((a, g) => a + g.stat.saves, 0);
    const shots = p.games.reduce((a, g) => a + g.stat.shotsAgainst, 0);
    return gp ? `${gp} GP · ${shots ? ((saves / shots) * 100).toFixed(1) + " SV%" : "no shots logged"}` : "No games yet";
  }
  if (!gp) {
    const ls = p.lastSeason;
    if (ls?.gamesPlayed) {
      const pts = (ls.goals ?? 0) + (ls.assists ?? 0);
      return `Last season: ${ls.gamesPlayed} GP · ${ls.goals ?? 0}G ${ls.assists ?? 0}A ${pts}P`;
    }
    return "No games yet";
  }
  const pts = p.seasonGoals + p.seasonAssists;
  const pm = p.seasonPlusMinus > 0 ? `+${p.seasonPlusMinus}` : `${p.seasonPlusMinus}`;
  return `${gp} GP · ${p.seasonGoals}G ${p.seasonAssists}A ${pts}P · ${pm}`;
}

export function ratePlayers(input: LineupInput): RatedPlayer[] {
  const base = input.players.map((p) => {
    const group = groupOf(p);
    return { p, group, m: rawMetrics(p) };
  });

  const pool = (group: "F" | "D", key: keyof RawMetrics) =>
    base.filter((b) => b.group === group).map((b) => b.m[key] as number | null);

  return base.map(({ p, group, m }) => {
    let ratings: PlayerRatings;
    let savePct: number | null = null;

    if (group === "G") {
      const saves = p.games.reduce((a, g) => a + g.stat.saves, 0);
      const shots = p.games.reduce((a, g) => a + g.stat.shotsAgainst, 0);
      savePct = shots ? (saves / shots) * 100 : null;
      const overall = savePct === null ? 50 : Math.max(0, Math.min(100, 50 + (savePct - 88) * 5));
      ratings = { scoring: 0, playmaking: 0, defense: 0, physical: 0, transition: 0, faceoff: null, overall: shrink(overall, p.games.length) };
    } else {
      const g = group;
      const pc = (key: keyof RawMetrics, hib = true) => percentile(m[key] as number | null, pool(g, key), hib);
      const goals = pc("goals");
      const assists = pc("assists");
      const shots = pc("shots");
      const takeaways = pc("takeaways");
      const giveaways = pc("giveaways", false);
      const hits = pc("hits");
      const blocks = pc("blocks");
      const plusMinus = pc("plusMinus");
      const entry = pc("entryPct");
      const exit = pc("exitPct");

      const scoring = 0.6 * goals + 0.4 * shots;
      const playmaking = g === "F" ? 0.7 * assists + 0.3 * entry : 0.5 * assists + 0.5 * exit;
      const defense = 0.35 * takeaways + 0.25 * blocks + 0.25 * giveaways + 0.15 * plusMinus;
      const physical = 0.7 * hits + 0.3 * blocks;
      const transition = g === "F" ? 0.7 * entry + 0.3 * exit : 0.3 * entry + 0.7 * exit;
      const faceoff = m.faceoffPct === null ? null : Math.max(0, Math.min(100, 50 + (m.faceoffPct - 50) * 2.5));

      const overallRaw =
        g === "F"
          ? 0.3 * scoring + 0.25 * playmaking + 0.2 * defense + 0.1 * physical + 0.15 * transition
          : 0.15 * scoring + 0.2 * playmaking + 0.35 * defense + 0.15 * physical + 0.15 * transition;

      const s = (v: number) => shrink(v, m.evidence);
      ratings = {
        scoring: s(scoring),
        playmaking: s(playmaking),
        defense: s(defense),
        physical: s(physical),
        transition: s(transition),
        faceoff: faceoff === null ? null : s(faceoff),
        overall: s(overallRaw),
      };
    }

    // Who actually plays: favour regular dressers.
    const dressed = p.games.length;
    const considered = dressed + p.gamesScratched;
    const dressRate = input.teamGamesPlayed > 0 && considered > 0 ? dressed / considered : null;
    const usage = dressRate === null ? 1 : 0.88 + 0.12 * dressRate;

    return {
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      jerseyNumber: p.jerseyNumber,
      group,
      slots: slotsOf(p, group),
      positionSet: p.primaryPosition !== null,
      shoots: p.shoots,
      ratings,
      style: styleOf(group, ratings),
      value: ratings.overall * usage,
      gamesThisSeason: dressed,
      dressRate,
      hasData: m.evidence > 0,
      usedLastSeason: m.usedLastSeason,
      statLine: statLineOf(p, group),
      savePct,
    };
  });
}

// ---------------------------------------------------------------------------
// Slot fit

/** How well a player suits a slot (0 = can't play it). */
export function slotFit(p: RatedPlayer, slot: SpecificPosition): { fit: number; note: string | null } {
  const isF = (s: SpecificPosition) => s === "C" || s === "LW" || s === "RW";
  const isD = (s: SpecificPosition) => s === "LD" || s === "RD";
  let fit: number;
  let note: string | null = null;

  if (p.slots[0] === slot) fit = 1;
  else if (p.slots.includes(slot)) {
    fit = 0.93;
    note = "Secondary position";
  } else if (isF(slot) && isF(p.slots[0])) {
    if (slot === "C") fit = 0.75;
    else if (p.slots[0] === "C") fit = 0.85;
    else fit = 0.88;
    note = slot === "C" ? "Playing center" : "Out of position";
  } else if (isD(slot) && isD(p.slots[0])) {
    fit = 0.9;
    note = "Other side";
  } else return { fit: 0, note: null };

  // Handedness: natural side for wings and D.
  const wantLeft = slot === "LW" || slot === "LD";
  const wantRight = slot === "RW" || slot === "RD";
  if (p.shoots && (wantLeft || wantRight)) {
    const natural = (wantLeft && p.shoots === "LEFT") || (wantRight && p.shoots === "RIGHT");
    fit += natural ? 0.03 : -0.04;
    if (!natural && !note) note = isD(slot) ? "Off side" : "Off-wing";
  }
  return { fit, note };
}

// ---------------------------------------------------------------------------
// Lineup search

const F_LINE_WEIGHTS = [1.0, 0.9, 0.8, 0.7];
const D_PAIR_WEIGHTS = [1.0, 0.88, 0.76];
const SLOT_ORDER: SpecificPosition[] = [
  ...[0, 1, 2, 3].flatMap(() => ["C", "LW", "RW"] as SpecificPosition[]),
  ...[0, 1, 2].flatMap(() => ["LD", "RD"] as SpecificPosition[]),
];
const N_F = 12;

function slotWeight(i: number): number {
  return i < N_F ? F_LINE_WEIGHTS[Math.floor(i / 3)] : D_PAIR_WEIGHTS[Math.floor((i - N_F) / 2)];
}

function forwardChemistry(players: (RatedPlayer | null)[], lineIndex: number, center: RatedPlayer | null): { bonus: number; notes: string[] } {
  const ps = players.filter((p): p is RatedPlayer => p !== null);
  const notes: string[] = [];
  let bonus = 0;
  if (ps.length < 2) return { bonus, notes };

  const scorer = [...ps].sort((a, b) => b.ratings.scoring - a.ratings.scoring)[0];
  const setter = [...ps].filter((p) => p !== scorer).sort((a, b) => b.ratings.playmaking - a.ratings.playmaking)[0];
  if (scorer.ratings.scoring >= 58 && setter && setter.ratings.playmaking >= 58) {
    bonus += 6;
    notes.push(`${lastName(setter)} sets up, ${lastName(scorer)} finishes`);
  }

  const d = [...ps].sort((a, b) => b.ratings.defense - a.ratings.defense)[0];
  if (d.ratings.defense >= 55) {
    bonus += 4;
    notes.push(`${lastName(d)} keeps it responsible defensively`);
  } else {
    bonus -= 4;
    notes.push("Light on defensive play");
  }

  if (center && center.ratings.faceoff !== null) {
    if (center.ratings.faceoff >= 55) {
      bonus += 3;
      notes.push(`${lastName(center)} strong on faceoffs`);
    } else if (center.ratings.faceoff < 40) bonus -= 2;
  }

  if (lineIndex >= 2) {
    const grit = Math.max(...ps.map((p) => p.ratings.physical));
    if (grit >= 60) {
      bonus += 2;
      notes.push("Brings energy and physical play");
    }
  }

  if (ps.length === 3 && ps.every((p) => p.style === ps[0].style)) bonus -= 3;
  return { bonus, notes };
}

function pairChemistry(ld: RatedPlayer | null, rd: RatedPlayer | null): { bonus: number; notes: string[] } {
  const notes: string[] = [];
  let bonus = 0;
  if (!ld || !rd) return { bonus, notes };
  const [mover, keeper] = ld.ratings.playmaking + ld.ratings.transition >= rd.ratings.playmaking + rd.ratings.transition ? [ld, rd] : [rd, ld];
  if ((mover.ratings.playmaking + mover.ratings.transition) / 2 >= 55 && keeper.ratings.defense >= 55) {
    bonus += 5;
    notes.push(`${lastName(mover)} moves the puck, ${lastName(keeper)} stays home`);
  }
  if (ld.ratings.defense < 45 && rd.ratings.defense < 45) {
    bonus -= 5;
    notes.push("Both lean offensive — watch the back end");
  }
  return { bonus, notes };
}

function lastName(p: RatedPlayer): string {
  return p.name.split(" ").slice(1).join(" ") || p.name;
}

/** Assignment: index per slot into the candidate list, -1 for an empty slot. */
type Assignment = number[];

function scoreAssignment(a: Assignment, cand: RatedPlayer[]): number {
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] < 0) continue;
    const { fit } = slotFit(cand[a[i]], SLOT_ORDER[i]);
    if (fit <= 0) return -Infinity;
    total += cand[a[i]].value * fit * slotWeight(i);
  }
  for (let l = 0; l < 4; l++) {
    const idx = [l * 3, l * 3 + 1, l * 3 + 2];
    const ps = idx.map((i) => (a[i] >= 0 ? cand[a[i]] : null));
    total += forwardChemistry(ps, l, ps[0]).bonus * F_LINE_WEIGHTS[l];
  }
  for (let d = 0; d < 3; d++) {
    const i = N_F + d * 2;
    total += pairChemistry(a[i] >= 0 ? cand[a[i]] : null, a[i + 1] >= 0 ? cand[a[i + 1]] : null).bonus * D_PAIR_WEIGHTS[d];
  }
  return total;
}

/** Small deterministic random generator so results are stable between page loads. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

function greedy(cand: RatedPlayer[], rand: () => number, noise: number): Assignment {
  const used = new Set<number>();
  return SLOT_ORDER.map((slot, i) => {
    let best = -1;
    let bestVal = -Infinity;
    cand.forEach((p, ci) => {
      if (used.has(ci)) return;
      const { fit } = slotFit(p, slot);
      if (fit <= 0) return;
      const v = p.value * fit * slotWeight(i) * (1 + (rand() - 0.5) * noise);
      if (v > bestVal) {
        bestVal = v;
        best = ci;
      }
    });
    if (best >= 0) used.add(best);
    return best;
  });
}

/** Hill climbing: swap two slots, or swap a dressed player with an extra, while it helps. */
function improve(a: Assignment, candCount: number, scoreFn: (a: Assignment) => number): { a: Assignment; score: number } {
  let cur = [...a];
  let score = scoreFn(cur);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < cur.length; i++) {
      for (let j = i + 1; j < cur.length; j++) {
        if (cur[i] === cur[j]) continue;
        const next = [...cur];
        [next[i], next[j]] = [next[j], next[i]];
        const s = scoreFn(next);
        if (s > score + 1e-9) {
          cur = next;
          score = s;
          improved = true;
        }
      }
      const dressed = new Set(cur);
      for (let ci = 0; ci < candCount; ci++) {
        if (dressed.has(ci)) continue;
        const previous = cur[i];
        const next = [...cur];
        next[i] = ci;
        const s = scoreFn(next);
        if (s > score + 1e-9) {
          cur = next;
          score = s;
          improved = true;
          dressed.delete(previous);
          dressed.add(ci);
        }
      }
    }
  }
  return { a: cur, score };
}

/** Each line and pair as an order-free key (same three forwards = same line, wherever it's placed). */
function unitKeys(a: Assignment): string[] {
  const keys: string[] = [];
  for (let l = 0; l < 4; l++) keys.push("F:" + [a[l * 3], a[l * 3 + 1], a[l * 3 + 2]].filter((x) => x >= 0).sort((x, y) => x - y).join(","));
  for (let d = 0; d < 3; d++) keys.push("D:" + [a[N_F + d * 2], a[N_F + d * 2 + 1]].filter((x) => x >= 0).sort((x, y) => x - y).join(","));
  return keys;
}

/** How many lines/pairs in `a` don't appear (as the same group of players) in `b`. */
function unitDifference(a: Assignment, b: Assignment): number {
  const other = new Set(unitKeys(b));
  return unitKeys(a).filter((k) => !other.has(k)).length;
}

/** A new option must change at least this many lines/pairs from every earlier option. */
const MIN_UNITS_CHANGED = 2;

/** Points taken off for reusing a line/pair from an earlier option, to steer the search elsewhere. */
const REUSE_PENALTY = 12;

/** Best lineup found from several starting points, scored with an optional penalty for reusing earlier units. */
function search(cand: RatedPlayer[], restarts: number, seedBase: number, avoid: Set<string>): { a: Assignment; score: number } | null {
  const scoreFn = (a: Assignment) => {
    const s = scoreAssignment(a, cand);
    if (!avoid.size || !Number.isFinite(s)) return s;
    return s - unitKeys(a).filter((k) => avoid.has(k)).length * REUSE_PENALTY;
  };
  let best: { a: Assignment; score: number } | null = null;
  for (let r = 0; r < restarts; r++) {
    const rand = rng(seedBase + r * 7919);
    const res = improve(greedy(cand, rand, r === 0 ? 0 : 0.6), cand.length, scoreFn);
    if (Number.isFinite(res.score) && (!best || res.score > best.score)) best = res;
  }
  return best;
}

function buildOption(a: Assignment, cand: RatedPlayer[], score: number): LineupOption {
  const assign = (i: number): SlotAssignment => {
    const p = a[i] >= 0 ? cand[a[i]] : null;
    const { fit, note } = p ? slotFit(p, SLOT_ORDER[i]) : { fit: 0, note: null };
    return { slot: SLOT_ORDER[i], player: p, fit, note };
  };
  const forwards: ForwardLine[] = [0, 1, 2, 3].map((l) => {
    const c = assign(l * 3);
    const lw = assign(l * 3 + 1);
    const rw = assign(l * 3 + 2);
    const ps = [c.player, lw.player, rw.player];
    const chem = forwardChemistry(ps, l, c.player);
    const notes = [...chem.notes];
    for (const s of [lw, c, rw]) if (s.player && s.note) notes.push(`${lastName(s.player)}: ${s.note.toLowerCase()}`);
    const present = ps.filter((p): p is RatedPlayer => p !== null);
    return {
      number: l + 1,
      c,
      lw,
      rw,
      notes,
      rating: present.length ? present.reduce((x, p) => x + p.ratings.overall, 0) / present.length : 0,
    };
  });
  const defense: DefensePair[] = [0, 1, 2].map((d) => {
    const ld = assign(N_F + d * 2);
    const rd = assign(N_F + d * 2 + 1);
    const chem = pairChemistry(ld.player, rd.player);
    const notes = [...chem.notes];
    if (ld.player?.shoots === "LEFT" && rd.player?.shoots === "RIGHT") notes.push("Left and right shots on their natural sides");
    for (const s of [ld, rd]) if (s.player && s.note) notes.push(`${lastName(s.player)}: ${s.note.toLowerCase()}`);
    const present = [ld.player, rd.player].filter((p): p is RatedPlayer => p !== null);
    return {
      number: d + 1,
      ld,
      rd,
      notes,
      rating: present.length ? present.reduce((x, p) => x + p.ratings.overall, 0) / present.length : 0,
    };
  });
  // Strongest line/pair first (open spots count as zero).
  const strength = (slots: SlotAssignment[]) => slots.reduce((x, s) => x + (s.player ? s.player.value * s.fit : 0), 0);
  forwards.sort((x, y) => strength([y.lw, y.c, y.rw]) - strength([x.lw, x.c, x.rw])).forEach((l, i) => (l.number = i + 1));
  defense.sort((x, y) => strength([y.ld, y.rd]) - strength([x.ld, x.rd])).forEach((d, i) => (d.number = i + 1));

  const dressed = new Set(a.filter((i) => i >= 0));
  const extras = cand.filter((_, i) => !dressed.has(i)).sort((x, y) => y.value - x.value);
  return { forwards, defense, extras, score };
}

// ---------------------------------------------------------------------------
// Entry point

export function buildLineup(input: LineupInput, maxOptions = 10): LineupResult {
  const rated = ratePlayers(input);
  const byId = new Map(input.players.map((p) => [p.id, p]));

  const out: OutPlayer[] = [];
  const available: RatedPlayer[] = [];
  for (const r of rated) {
    const p = byId.get(r.id)!;
    if (p.status === "INJURED") out.push({ player: r, reason: "Injured" });
    else if (p.status === "UNAVAILABLE") out.push({ player: r, reason: "Unavailable" });
    else if (p.nextGameStatus === "INJURED") out.push({ player: r, reason: "Injured for the next game" });
    else if (p.nextGameStatus === "SCRATCHED") out.push({ player: r, reason: "Scratched for the next game" });
    else available.push(r);
  }

  const skaters = available.filter((r) => r.group !== "G");
  const goaliesRanked = available
    .filter((r) => r.group === "G")
    .sort((a, b) => b.value - a.value || b.gamesThisSeason - a.gamesThisSeason);

  // Best lineup first, then alternatives that change at least two lines or
  // pairs, found by penalising lines/pairs already used in earlier options.
  const distinct: { a: Assignment; score: number }[] = [];
  const best = search(skaters, 30, 1000, new Set());
  if (best) {
    distinct.push({ a: best.a, score: scoreAssignment(best.a, skaters) });
    const avoid = new Set(unitKeys(best.a));
    for (let k = 1; k < maxOptions * 2 && distinct.length < maxOptions; k++) {
      const alt = search(skaters, 8, 1000 + k * 104729, avoid);
      if (!alt) break;
      for (const key of unitKeys(alt.a)) avoid.add(key);
      if (distinct.every((d) => unitDifference(alt.a, d.a) >= MIN_UNITS_CHANGED)) {
        distinct.push({ a: alt.a, score: scoreAssignment(alt.a, skaters) });
      }
    }
  }

  // Keep the best first; order the alternatives from strongest to weakest.
  if (distinct.length > 2) distinct.splice(1, distinct.length - 1, ...distinct.slice(1).sort((x, y) => y.score - x.score));

  const options = distinct.map((d) => buildOption(d.a, skaters, d.score));

  const warnings: string[] = [];
  const noPos = rated.filter((r) => !r.positionSet && r.group !== "G");
  if (noPos.length) warnings.push(`${noPos.length} player${noPos.length > 1 ? "s have" : " has"} no specific position set (${noPos.map((r) => `#${r.jerseyNumber}`).join(", ")}) — placed by forward/defense and shooting hand.`);
  const noHand = rated.filter((r) => !r.shoots && r.group !== "G");
  if (noHand.length) warnings.push(`${noHand.length} player${noHand.length > 1 ? "s have" : " has"} no shooting hand set (${noHand.map((r) => `#${r.jerseyNumber}`).join(", ")}).`);
  const noData = available.filter((r) => !r.hasData && r.group !== "G");
  if (noData.length) warnings.push(`${noData.length} player${noData.length > 1 ? "s have" : " has"} no stats yet, so they're rated as average (${noData.map((r) => `#${r.jerseyNumber}`).join(", ")}).`);
  const fCount = skaters.filter((r) => r.slots.some((s) => F_SLOTS.includes(s))).length;
  const dCount = skaters.filter((r) => r.slots.some((s) => D_SLOTS.includes(s))).length;
  if (fCount < 12) warnings.push(`Only ${fCount} available forwards — some forward spots are left open.`);
  if (dCount < 6) warnings.push(`Only ${dCount} available defensemen — some defense spots are left open.`);
  if (input.teamGamesPlayed < 3) warnings.push("Early in the season: ratings lean on last season's report cards until more games are logged.");

  return {
    options,
    goalies: { starter: goaliesRanked[0] ?? null, backup: goaliesRanked[1] ?? null, others: goaliesRanked.slice(2) },
    out,
    warnings,
  };
}
