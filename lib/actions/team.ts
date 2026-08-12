"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { seasonSchema, teamInfoSchema } from "@/lib/validation";
import { setCurrentSeason } from "@/lib/season";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Creates a brand-new season and its Team record together — the Version 1 onboarding step. */
export async function createSeasonWithTeam(formData: FormData): Promise<ActionResult> {
  const seasonParsed = seasonSchema.safeParse({ name: formData.get("seasonName") });
  if (!seasonParsed.success) {
    return { ok: false, error: seasonParsed.error.issues[0]?.message ?? "Invalid season" };
  }
  const teamParsed = teamInfoSchema.safeParse({
    name: formData.get("name"),
    league: formData.get("league") || undefined,
    division: formData.get("division") || undefined,
    headCoach: formData.get("headCoach") || undefined,
    assistantCoaches: formData.get("assistantCoaches") || undefined,
  });
  if (!teamParsed.success) {
    return { ok: false, error: teamParsed.error.issues[0]?.message ?? "Invalid team info" };
  }

  const existing = await prisma.season.findUnique({ where: { name: seasonParsed.data.name } });
  if (existing) {
    return { ok: false, error: `Season "${seasonParsed.data.name}" already exists` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.season.updateMany({ data: { isCurrent: false }, where: { isCurrent: true } });
    const season = await tx.season.create({ data: { name: seasonParsed.data.name, isCurrent: true } });
    await tx.team.create({ data: { ...teamParsed.data, seasonId: season.id } });
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateTeamInfo(seasonId: string, formData: FormData): Promise<ActionResult> {
  const parsed = teamInfoSchema.safeParse({
    name: formData.get("name"),
    league: formData.get("league") || undefined,
    division: formData.get("division") || undefined,
    headCoach: formData.get("headCoach") || undefined,
    assistantCoaches: formData.get("assistantCoaches") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid team info" };
  }

  await prisma.team.update({ where: { seasonId }, data: parsed.data });
  revalidatePath("/team");
  revalidatePath("/");
  return { ok: true };
}

/** Adds a new season without touching any prior season's data — history stays intact. */
export async function createNewSeason(formData: FormData): Promise<ActionResult> {
  const parsed = seasonSchema.safeParse({ name: formData.get("seasonName") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid season" };
  }
  const existing = await prisma.season.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return { ok: false, error: `Season "${parsed.data.name}" already exists` };
  }

  const previous = await prisma.team.findFirst({
    where: { season: { isCurrent: true } },
  });

  await prisma.$transaction(async (tx) => {
    await tx.season.updateMany({ data: { isCurrent: false }, where: { isCurrent: true } });
    const season = await tx.season.create({ data: { name: parsed.data.name, isCurrent: true } });
    // Carry forward team identity (name/league/division/coaches) into the new season; roster starts fresh.
    await tx.team.create({
      data: {
        seasonId: season.id,
        name: previous?.name ?? "New Team",
        league: previous?.league,
        division: previous?.division,
        headCoach: previous?.headCoach,
        assistantCoaches: previous?.assistantCoaches,
      },
    });
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function switchSeason(seasonId: string): Promise<ActionResult> {
  await setCurrentSeason(seasonId);
  revalidatePath("/", "layout");
  return { ok: true };
}
