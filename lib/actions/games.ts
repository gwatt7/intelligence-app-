"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { gameSchema, statLineSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import type { ActionResult } from "./team";
export type { ActionResult };

export async function createGame(seasonId: string, formData: FormData): Promise<ActionResult> {
  const parsed = gameSchema.safeParse({
    gameType: formData.get("gameType"),
    opponent: formData.get("opponent"),
    date: formData.get("date"),
    homeAway: formData.get("homeAway"),
    location: formData.get("location") || undefined,
    ourScore: formData.get("ourScore") || undefined,
    opponentScore: formData.get("opponentScore") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid game" };
  }

  const { date, ourScore, opponentScore, ...rest } = parsed.data;
  const isCompleted = ourScore !== null && ourScore !== undefined && opponentScore !== null && opponentScore !== undefined;

  const game = await prisma.game.create({
    data: {
      ...rest,
      date: new Date(date),
      ourScore: ourScore ?? null,
      opponentScore: opponentScore ?? null,
      isCompleted,
      seasonId,
    },
  });

  await logActivity(seasonId, "GAME_LOGGED", `Game vs ${game.opponent} created`);

  revalidatePath("/games");
  revalidatePath("/");
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
  revalidatePath("/");
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
  revalidatePath("/");
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
  revalidatePath("/");
  return { ok: true, imported, skipped };
}
