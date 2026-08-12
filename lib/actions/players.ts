"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { playerSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import type { ActionResult } from "./team";
export type { ActionResult };

export async function createPlayer(seasonId: string, formData: FormData): Promise<ActionResult> {
  const parsed = playerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    jerseyNumber: formData.get("jerseyNumber"),
    position: formData.get("position"),
    shoots: formData.get("shoots"),
    status: formData.get("status") || "ACTIVE",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid player" };
  }

  const dupe = await prisma.player.findUnique({
    where: { seasonId_jerseyNumber: { seasonId, jerseyNumber: parsed.data.jerseyNumber } },
  });
  if (dupe) {
    return { ok: false, error: `Jersey #${parsed.data.jerseyNumber} is already taken` };
  }

  const player = await prisma.player.create({ data: { ...parsed.data, seasonId } });
  await logActivity(
    seasonId,
    "PLAYER_UPDATED",
    `${player.firstName} ${player.lastName} (#${player.jerseyNumber}) added to the roster`
  );

  revalidatePath("/team");
  revalidatePath("/players");
  revalidatePath("/");
  return { ok: true };
}

export async function updatePlayer(playerId: string, formData: FormData): Promise<ActionResult> {
  const parsed = playerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    jerseyNumber: formData.get("jerseyNumber"),
    position: formData.get("position"),
    shoots: formData.get("shoots"),
    status: formData.get("status") || "ACTIVE",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid player" };
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { ok: false, error: "Player not found" };

  if (parsed.data.jerseyNumber !== player.jerseyNumber) {
    const dupe = await prisma.player.findUnique({
      where: { seasonId_jerseyNumber: { seasonId: player.seasonId, jerseyNumber: parsed.data.jerseyNumber } },
    });
    if (dupe) return { ok: false, error: `Jersey #${parsed.data.jerseyNumber} is already taken` };
  }

  await prisma.player.update({ where: { id: playerId }, data: parsed.data });
  await logActivity(
    player.seasonId,
    "PLAYER_UPDATED",
    `${parsed.data.firstName} ${parsed.data.lastName} (#${parsed.data.jerseyNumber}) updated`
  );

  revalidatePath("/team");
  revalidatePath("/players");
  revalidatePath(`/players/${playerId}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deletePlayer(playerId: string): Promise<ActionResult> {
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { ok: false, error: "Player not found" };

  await prisma.player.delete({ where: { id: playerId } });
  await logActivity(player.seasonId, "PLAYER_UPDATED", `${player.firstName} ${player.lastName} removed from the roster`);

  revalidatePath("/team");
  revalidatePath("/players");
  revalidatePath("/");
  return { ok: true };
}
