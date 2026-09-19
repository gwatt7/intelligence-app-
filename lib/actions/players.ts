"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { playerSchema, playerBioSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import type { ActionResult } from "./team";
export type { ActionResult };

// A resized headshot (see PlayerPhotoUpload's client-side canvas resize) is
// well under this; it's a sanity cap against something slipping through
// unresized, not a real limit anyone should hit.
const MAX_PHOTO_DATA_URI_LENGTH = 2_000_000;

// Background/hero photos are resized to a larger max dimension than
// headshots (see PlayerBackgroundPhotoUpload) since they're displayed
// larger, so they get a bit more headroom here for the same reason.
const MAX_HERO_IMAGE_DATA_URI_LENGTH = 4_000_000;

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

/** Profile presentation fields — separate from the roster identity fields (playerSchema) above, since they're edited from the Player Profile page rather than the Roster table. */
export async function updatePlayerBio(playerId: string, formData: FormData): Promise<ActionResult> {
  const parsed = playerBioSchema.safeParse({
    hometown: formData.get("hometown") || undefined,
    height: formData.get("height") || undefined,
    weight: formData.get("weight") || undefined,
    classYear: formData.get("classYear") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid info" };
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { ok: false, error: "Player not found" };

  await prisma.player.update({
    where: { id: playerId },
    data: {
      hometown: parsed.data.hometown ?? null,
      height: parsed.data.height ?? null,
      weight: parsed.data.weight ?? null,
      classYear: parsed.data.classYear ?? null,
    },
  });

  revalidatePath(`/players/${playerId}`);
  revalidatePath("/players");
  return { ok: true };
}

/**
 * Sets (or clears, if `photoDataUri` is null) one player's headshot. Stored
 * directly as a data: URI on that player's own row — there's no shared file
 * store here, so editing one player's photo can never touch another's; each
 * update targets exactly one Player row by id.
 */
export async function updatePlayerPhoto(playerId: string, photoDataUri: string | null): Promise<ActionResult> {
  if (photoDataUri !== null) {
    if (!photoDataUri.startsWith("data:image/")) {
      return { ok: false, error: "Invalid image" };
    }
    if (photoDataUri.length > MAX_PHOTO_DATA_URI_LENGTH) {
      return { ok: false, error: "Image is too large — please use a smaller photo" };
    }
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { ok: false, error: "Player not found" };

  await prisma.player.update({ where: { id: playerId }, data: { photoUrl: photoDataUri } });

  revalidatePath(`/players/${playerId}`);
  revalidatePath("/players");
  revalidatePath("/team");
  revalidatePath("/");
  return { ok: true };
}

/**
 * Sets (or clears, if `heroImageDataUri` is null) one player's background
 * photo, completely independent of `updatePlayerPhoto` above — this never
 * touches `photoUrl`, and that function never touches this. Stored directly
 * as a data: URI on that same player's own row (same reasoning as
 * updatePlayerPhoto: no shared file store, and per-row storage means
 * editing one player's background photo can never touch another's).
 *
 * `focalX`/`focalY` are an optional 0-100 "which part of the photo
 * matters" point (applied as CSS object-position wherever the background
 * photo is displayed — PlayerProfileHero and the Players-tab roster card),
 * letting a coach fine-tune framing without re-cropping the source photo.
 * null means "no preference — let each display site use its own default."
 *
 * `brightness` is a 0-1 average-luminance reading of the same photo
 * (computed client-side, see lib/client-image-resize.ts), used to pick
 * readable text/scrim colors over it. null means "unknown — fall back to
 * the original light-scrim/dark-text look."
 */
export async function updatePlayerHeroImage(
  playerId: string,
  heroImageDataUri: string | null,
  focalX: number | null,
  focalY: number | null,
  brightness: number | null
): Promise<ActionResult> {
  if (heroImageDataUri !== null) {
    if (!heroImageDataUri.startsWith("data:image/")) {
      return { ok: false, error: "Invalid image" };
    }
    if (heroImageDataUri.length > MAX_HERO_IMAGE_DATA_URI_LENGTH) {
      return { ok: false, error: "Image is too large — please use a smaller photo" };
    }
  }
  for (const focal of [focalX, focalY]) {
    if (focal !== null && (Number.isNaN(focal) || focal < 0 || focal > 100)) {
      return { ok: false, error: "Invalid image position" };
    }
  }
  if (brightness !== null && (Number.isNaN(brightness) || brightness < 0 || brightness > 1)) {
    return { ok: false, error: "Invalid image brightness" };
  }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) return { ok: false, error: "Player not found" };

  await prisma.player.update({
    where: { id: playerId },
    data: {
      heroImageUrl: heroImageDataUri,
      heroImageFocalX: focalX,
      heroImageFocalY: focalY,
      heroImageBrightness: brightness,
    },
  });

  revalidatePath(`/players/${playerId}`);
  revalidatePath("/players");
  revalidatePath("/team");
  revalidatePath("/");
  return { ok: true };
}
