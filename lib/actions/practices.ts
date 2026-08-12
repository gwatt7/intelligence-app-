"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { practiceSchema, statLineSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import type { ActionResult } from "./team";
export type { ActionResult };

export async function createPractice(seasonId: string, formData: FormData): Promise<ActionResult> {
  const parsed = practiceSchema.safeParse({
    week: formData.get("week"),
    number: formData.get("number"),
    date: formData.get("date"),
    location: formData.get("location") || undefined,
    focus: formData.get("focus") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid practice" };
  }

  const dupe = await prisma.practice.findUnique({
    where: { seasonId_number: { seasonId, number: parsed.data.number } },
  });
  if (dupe) return { ok: false, error: `Practice #${parsed.data.number} already exists this season` };

  const practice = await prisma.practice.create({
    data: { ...parsed.data, date: new Date(parsed.data.date), seasonId },
  });

  await logActivity(seasonId, "PRACTICE_LOGGED", `Practice ${practice.number} (Week ${practice.week}) created`);

  revalidatePath("/practices");
  revalidatePath("/");
  redirect(`/practices/${practice.id}`);
}

export async function updatePracticeNotes(practiceId: string, formData: FormData): Promise<ActionResult> {
  const practice = await prisma.practice.findUnique({ where: { id: practiceId } });
  if (!practice) return { ok: false, error: "Practice not found" };

  await prisma.practice.update({
    where: { id: practiceId },
    data: {
      focus: (formData.get("focus") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
      location: (formData.get("location") as string)?.trim() || null,
    },
  });

  revalidatePath(`/practices/${practiceId}`);
  return { ok: true };
}

/** Saves one player's stat line for a practice. Upserts (unique on practiceId+playerId) so re-entering the same player just corrects the prior save — no silent duplicate rows. */
export async function savePracticePlayerStat(
  practiceId: string,
  playerId: string,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = statLineSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid statistics" };
  }

  const practice = await prisma.practice.findUnique({ where: { id: practiceId } });
  if (!practice) return { ok: false, error: "Practice not found" };

  await prisma.practicePlayerStat.upsert({
    where: { practiceId_playerId: { practiceId, playerId } },
    create: { practiceId, playerId, ...parsed.data },
    update: parsed.data,
  });

  await logActivity(practice.seasonId, "PRACTICE_LOGGED", `Stats updated for Practice ${practice.number}`);

  revalidatePath(`/practices/${practiceId}`);
  revalidatePath("/players");
  revalidatePath("/analytics");
  revalidatePath("/");
  return { ok: true };
}

/** Bulk-imports parsed CSV rows (one row per player) into a practice. Unmatched jersey numbers are reported back rather than silently dropped. */
export async function importPracticeStatsFromCsv(
  practiceId: string,
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
    await prisma.practicePlayerStat.upsert({
      where: { practiceId_playerId: { practiceId, playerId: player.id } },
      create: { practiceId, playerId: player.id, ...parsed.data },
      update: parsed.data,
    });
    imported++;
  }

  const practice = await prisma.practice.findUnique({ where: { id: practiceId } });
  if (practice) {
    await logActivity(seasonId, "PRACTICE_LOGGED", `Imported stats for Practice ${practice.number} (${imported} players)`);
  }

  revalidatePath(`/practices/${practiceId}`);
  revalidatePath("/players");
  revalidatePath("/analytics");
  revalidatePath("/");
  return { ok: true, imported, skipped };
}
