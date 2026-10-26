"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { gameSchema, situationStatSchema, statLineSchema } from "@/lib/validation";
import { parseIceTime, SITUATION_FIELDS, SITUATION_LABEL, type Situation } from "@/lib/situation-stats";
import { logActivity } from "@/lib/activity";
import type { ActionResult } from "./team";
export type { ActionResult };

export async function createGame(seasonId: string, formData: FormData): Promise<ActionResult> {
  const timeTBA = formData.get("timeTBA") === "on";
  const timeValue = (formData.get("time") as string) || "19:00"; // default 7:00 PM, ignored entirely when timeTBA

  const parsed = gameSchema.safeParse({
    gameType: formData.get("gameType"),
    opponent: formData.get("opponent"),
    date: formData.get("date"),
    homeAway: formData.get("homeAway"),
    location: formData.get("location") || undefined,
    arena: formData.get("arena") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    tournamentName: formData.get("tournamentName") || undefined,
    specialEvent: formData.get("specialEvent") || undefined,
    timeTBA,
    ourScore: formData.get("ourScore") || undefined,
    opponentScore: formData.get("opponentScore") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid game" };
  }

  const { date, ourScore, opponentScore, ...rest } = parsed.data;
  const isCompleted = ourScore !== null && ourScore !== undefined && opponentScore !== null && opponentScore !== undefined;
  const dateTime = timeTBA ? new Date(`${date}T00:00:00`) : new Date(`${date}T${timeValue}:00`);

  const game = await prisma.game.create({
    data: {
      ...rest,
      date: dateTime,
      ourScore: ourScore ?? null,
      opponentScore: opponentScore ?? null,
      isCompleted,
      seasonId,
    },
  });

  await logActivity(seasonId, "GAME_LOGGED", `Game vs ${game.opponent} created`);

  revalidatePath("/games");
  revalidatePath("/dashboard");
  redirect(`/games/${game.id}`);
}

export async function updateGameResultAndNotes(gameId: string, formData: FormData): Promise<ActionResult> {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return { ok: false, error: "Game not found" };

  const ourScoreRaw = formData.get("ourScore");
  const opponentScoreRaw = formData.get("opponentScore");
  const ourScore = ourScoreRaw !== null && ourScoreRaw !== "" ? Number(ourScoreRaw) : null;
  const opponentScore = opponentScoreRaw !== null && opponentScoreRaw !== "" ? Number(opponentScoreRaw) : null;

  if (ourScore !== null && (Number.isNaN(ourScore) || ourScore < 0)) {
    return { ok: false, error: "Our score must be zero or greater" };
  }
  if (opponentScore !== null && (Number.isNaN(opponentScore) || opponentScore < 0)) {
    return { ok: false, error: "Opponent score must be zero or greater" };
  }

  await prisma.game.update({
    where: { id: gameId },
    data: {
      ourScore,
      opponentScore,
      isCompleted: ourScore !== null && opponentScore !== null,
      location: (formData.get("location") as string)?.trim() || null,
      whatWentWell: (formData.get("whatWentWell") as string)?.trim() || null,
      whatWentWrong: (formData.get("whatWentWrong") as string)?.trim() || null,
      coachNotes: (formData.get("coachNotes") as string)?.trim() || null,
    },
  });

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function saveGamePlayerStat(gameId: string, playerId: string, formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = statLineSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid statistics" };
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return { ok: false, error: "Game not found" };

  await prisma.gamePlayerStat.upsert({
    where: { gameId_playerId: { gameId, playerId } },
    create: { gameId, playerId, ...parsed.data },
    update: parsed.data,
  });

  await logActivity(game.seasonId, "GAME_LOGGED", `Stats updated for game vs ${game.opponent}`);

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/players");
  revalidatePath("/analytics");
  revalidatePath("/weekly-rankings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function importGameStatsFromCsv(
  gameId: string,
  seasonId: string,
  rows: Record<string, number>[]
): Promise<{ ok: true; imported: number; skipped: number[] } | { ok: false; error: string }> {
  const players = await prisma.player.findMany({ where: { seasonId } });
  const byJersey = new Map(players.map((p) => [p.jerseyNumber, p]));

  let imported = 0;
  const skipped: number[] = [];

  for (const row of rows) {
    const jerseyNumber = row.jerseyNumber;
    const player = byJersey.get(jerseyNumber);
    if (!player) {
      skipped.push(jerseyNumber);
      continue;
    }
    const parsed = statLineSchema.safeParse(row);
    if (!parsed.success) {
      skipped.push(jerseyNumber);
      continue;
    }
    await prisma.gamePlayerStat.upsert({
      where: { gameId_playerId: { gameId, playerId: player.id } },
      create: { gameId, playerId: player.id, ...parsed.data },
      update: parsed.data,
    });
    imported++;
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (game) {
    await logActivity(seasonId, "GAME_LOGGED", `Imported stats for game vs ${game.opponent} (${imported} players)`);
  }

  revalidatePath(`/games/${gameId}`);
  revalidatePath("/players");
  revalidatePath("/analytics");
  revalidatePath("/weekly-rankings");
  revalidatePath("/dashboard");
  return { ok: true, imported, skipped };
}

// ---------------------------------------------------------------------------
// Power Play / Penalty Kill stats (GameSituationStat). Separate from the
// 5-on-5 line above (GamePlayerStat) — saving one never changes the other.

function revalidateSituation(gameId: string, playerId: string) {
  revalidatePath(`/games/${gameId}`);
  revalidatePath(`/players/${playerId}`);
}

export async function saveGameSituationStat(
  gameId: string,
  playerId: string,
  situation: Situation,
  formData: FormData
): Promise<ActionResult> {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return { ok: false, error: "Game not found" };

  // Only the fields that belong to this situation are read; the rest stay 0.
  const raw: Record<string, unknown> = { situation };
  for (const f of SITUATION_FIELDS[situation]) {
    if (f.key === "timeOnIceSeconds") {
      const seconds = parseIceTime(String(formData.get("timeOnIce") ?? ""));
      if (seconds === null) return { ok: false, error: "Enter power-play ice time as minutes:seconds, e.g. 3:45" };
      raw.timeOnIceSeconds = seconds;
    } else {
      raw[f.key] = formData.get(f.key) ?? 0;
    }
  }
  const parsed = situationStatSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid statistics" };

  const { situation: _s, ...data } = parsed.data;
  void _s;
  await prisma.gameSituationStat.upsert({
    where: { gameId_playerId_situation: { gameId, playerId, situation } },
    create: { gameId, playerId, situation, ...data },
    update: data,
  });

  await logActivity(game.seasonId, "GAME_LOGGED", `${SITUATION_LABEL[situation]} stats updated for game vs ${game.opponent}`);
  revalidateSituation(gameId, playerId);
  return { ok: true };
}

export async function clearGameSituationStat(gameId: string, playerId: string, situation: Situation): Promise<ActionResult> {
  await prisma.gameSituationStat.deleteMany({ where: { gameId, playerId, situation } });
  revalidateSituation(gameId, playerId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Team special teams (Power Play % / Penalty Kill %). Blank = not recorded
// (stored as null, never 0). PP goals are not entered here — they come from
// the players' Power Play lines.

function optionalCount(v: FormDataEntryValue | null): number | null | "invalid" {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 && n <= 99 ? n : "invalid";
}

export async function saveGameSpecialTeams(gameId: string, formData: FormData): Promise<ActionResult> {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return { ok: false, error: "Game not found" };

  const powerPlayOpportunities = optionalCount(formData.get("powerPlayOpportunities"));
  const penaltyKillOpportunities = optionalCount(formData.get("penaltyKillOpportunities"));
  const powerPlayGoalsAgainst = optionalCount(formData.get("powerPlayGoalsAgainst"));
  if ([powerPlayOpportunities, penaltyKillOpportunities, powerPlayGoalsAgainst].includes("invalid")) {
    return { ok: false, error: "Enter whole numbers from 0 to 99, or leave a box blank if it wasn't recorded" };
  }
  if ((penaltyKillOpportunities === null) !== (powerPlayGoalsAgainst === null)) {
    return { ok: false, error: "Enter both Times Shorthanded and Power-Play Goals Against (or leave both blank)" };
  }

  await prisma.game.update({
    where: { id: gameId },
    data: {
      powerPlayOpportunities: powerPlayOpportunities as number | null,
      penaltyKillOpportunities: penaltyKillOpportunities as number | null,
      powerPlayGoalsAgainst: powerPlayGoalsAgainst as number | null,
    },
  });
  await logActivity(game.seasonId, "GAME_LOGGED", `Special teams updated for game vs ${game.opponent}`);
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/analytics");
  return { ok: true };
}
