"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { miniGameSchema, statLineSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import type { ActionResult } from "./team";
export type { ActionResult };

export async function createMiniGame(seasonId: string, formData: FormData): Promise<ActionResult> {
  const parsed = miniGameSchema.safeParse({
    date: formData.get("date"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid Mini Game" };
  }

  const miniGame = await prisma.miniGame.create({
    data: { date: new Date(parsed.data.date), notes: parsed.data.notes ?? null, seasonId },
  });

  await logActivity(seasonId, "MINI_GAME_LOGGED", `Mini Game (${parsed.data.date}) created`);

  revalidatePath("/mini-games");
  revalidatePath("/");
  redirect(`/mini-games/${miniGame.id}`);
}

export async function updateMiniGameNotes(miniGameId: string, formData: FormData): Promise<ActionResult> {
  const miniGame = await prisma.miniGame.findUnique({ where: { id: miniGameId } });
  if (!miniGame) return { ok: false, error: "Mini Game not found" };

  await prisma.miniGame.update({
    where: { id: miniGameId },
    data: { notes: (formData.get("notes") as string)?.trim() || null },
  });

  revalidatePath(`/mini-games/${miniGameId}`);
  return { ok: true };
}

/** Saves one player's Mini Game stat line. Upserts (unique on miniGameId+playerId) so re-entering the same player just corrects the prior save — no silent duplicate rows. Only ever writes to MiniGamePlayerStat; never touches GamePlayerStat. */
export async function saveMiniGamePlayerStat(
  miniGameId: string,
  playerId: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = statLineSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid statistics" };
  }

  const miniGame = await prisma.miniGame.findUnique({ where: { id: miniGameId } });
  if (!miniGame) return { ok: false, error: "Mini Game not found" };

  await prisma.miniGamePlayerStat.upsert({
    where: { miniGameId_playerId: { miniGameId, playerId } },
    create: { miniGameId, playerId, ...parsed.data },
    update: parsed.data,
  });

  await logActivity(miniGame.seasonId, "MINI_GAME_LOGGED", `Mini Game stats updated`);

  revalidatePath(`/mini-games/${miniGameId}`);
  revalidatePath("/mini-games");
  revalidatePath(`/players`);
  revalidatePath("/");
  return { ok: true };
}

export async function importMiniGameStatsFromCsv(
  miniGameId: string,
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
      skipped.push(row.jerseyNumber);
      continue;
    }
    await prisma.miniGamePlayerStat.upsert({
      where: { miniGameId_playerId: { miniGameId, playerId: player.id } },
      create: { miniGameId, playerId: player.id, ...parsed.data },
      update: parsed.data,
    });
    imported++;
  }

  const miniGame = await prisma.miniGame.findUnique({ where: { id: miniGameId } });
  if (miniGame) {
    await logActivity(seasonId, "MINI_GAME_LOGGED", `Imported Mini Game stats (${imported} players)`);
  }

  revalidatePath(`/mini-games/${miniGameId}`);
  revalidatePath("/mini-games");
  revalidatePath("/players");
  revalidatePath("/");
  return { ok: true, imported, skipped };
}

/** Deletes a Mini Game and, via onDelete: Cascade, its MiniGamePlayerStat rows. Never touches Game/GamePlayerStat. */
export async function deleteMiniGame(miniGameId: string): Promise<ActionResult> {
  const miniGame = await prisma.miniGame.findUnique({ where: { id: miniGameId } });
  if (!miniGame) return { ok: false, error: "Mini Game not found" };

  await prisma.miniGame.delete({ where: { id: miniGameId } });

  revalidatePath("/mini-games");
  revalidatePath("/players");
  revalidatePath("/");
  redirect("/mini-games");
}
