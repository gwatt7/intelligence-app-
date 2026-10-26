// Power Play / Penalty Kill stats — shared definitions and math.
//
// Storage: GameSituationStat (one row per player, per official game, per
// situation). The 5-on-5 stat line stays in GamePlayerStat, which is the only
// table the rest of Northstar reads. Nothing in this file touches 5-on-5 data,
// and Power Play and Penalty Kill totals are always computed separately.
//
// Client-safe (no database access).

import { pct } from "@/lib/stats";

export type Situation = "POWER_PLAY" | "PENALTY_KILL";
export type ProfileSituation = "EVEN" | Situation;

export const SITUATION_LABEL: Record<ProfileSituation, string> = {
  EVEN: "5-on-5",
  POWER_PLAY: "Power Play",
  PENALTY_KILL: "Penalty Kill",
};

/** URL value for each view (?situation=pp / pk); 5-on-5 is the default. */
export const SITUATION_PARAM: Record<ProfileSituation, string> = { EVEN: "5v5", POWER_PLAY: "pp", PENALTY_KILL: "pk" };

export function situationFromParam(value: string | undefined): ProfileSituation {
  return value === "pp" ? "POWER_PLAY" : value === "pk" ? "PENALTY_KILL" : "EVEN";
}

/** Raw counts stored per situation row. */
export interface SituationLine {
  goals: number;
  assists: number;
  shots: number;
  shotAttempts: number;
  timeOnIceSeconds: number;
  blocks: number;
  clears: number;
  faceoffsWon: number;
  faceoffsLost: number;
}

export type SituationKey = keyof SituationLine;

export const EMPTY_SITUATION_LINE: SituationLine = {
  goals: 0,
  assists: 0,
  shots: 0,
  shotAttempts: 0,
  timeOnIceSeconds: 0,
  blocks: 0,
  clears: 0,
  faceoffsWon: 0,
  faceoffsLost: 0,
};

/** Which raw fields each situation records (entry forms + display). */
export const SITUATION_FIELDS: Record<Situation, { key: SituationKey; label: string; hint?: string }[]> = {
  POWER_PLAY: [
    { key: "goals", label: "PP Goals" },
    { key: "assists", label: "PP Assists" },
    { key: "shots", label: "PP Shots", hint: "On goal" },
    { key: "shotAttempts", label: "PP Shot Attempts", hint: "On goal + missed + blocked" },
    { key: "faceoffsWon", label: "PP Faceoffs Won" },
    { key: "faceoffsLost", label: "PP Faceoffs Lost" },
    { key: "timeOnIceSeconds", label: "PP Ice Time", hint: "mm:ss" },
  ],
  PENALTY_KILL: [
    { key: "blocks", label: "PK Blocks" },
    { key: "clears", label: "PK Clears" },
    { key: "faceoffsWon", label: "PK Faceoffs Won" },
    { key: "faceoffsLost", label: "PK Faceoffs Lost" },
  ],
};

export function sumSituationLines(lines: SituationLine[]): SituationLine {
  const t = { ...EMPTY_SITUATION_LINE };
  for (const l of lines) for (const k of Object.keys(t) as SituationKey[]) t[k] += l[k];
  return t;
}

export function situationPoints(s: SituationLine): number {
  return s.goals + s.assists;
}
export function situationFaceoffPct(s: SituationLine): number | null {
  return pct(s.faceoffsWon, s.faceoffsWon + s.faceoffsLost);
}
/** Goals ÷ shots on goal. */
export function shotConversionPct(s: SituationLine): number | null {
  return pct(s.goals, s.shots);
}
/** Shots on goal ÷ shot attempts. */
export function shotAccuracyPct(s: SituationLine): number | null {
  return pct(s.shots, s.shotAttempts);
}

/** 754 → "12:34". */
export function formatIceTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m}:${String(seconds % 60).padStart(2, "0")}`;
}

/** "12:34" → 754, "12" → 720 (minutes), "" → 0. Returns null when it can't be read. */
export function parseIceTime(input: string): number | null {
  const v = input.trim();
  if (v === "") return 0;
  const mmss = v.match(/^(\d{1,3}):([0-5]\d)$/);
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
  if (/^\d{1,3}$/.test(v)) return Number(v) * 60;
  return null;
}
