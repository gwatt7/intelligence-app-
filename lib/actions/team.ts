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

/**
 * Adds a new season without touching any prior season's data — history stays
 * intact. Carries forward team identity and the roster (profile fields only:
 * name, jersey number, position, shoots) from the season that was current.
 * Every carried-over player starts the new season with zero stats, since no
 * Practice/Game/PlayerSeasonStat rows are copied — stat calculations already
 * treat "no logged rows" as the zero/empty state everywhere else in the app.
 */
export async function createNewSeason(formData: FormData): Promise<ActionResult> {
  const parsed = seasonSchema.safeParse({ name: formData.get("seasonName") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid season" };
  }
  const existing = await prisma.season.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return { ok: false, error: `Season "${parsed.data.name}" already exists` };
  }

  const previousSeason = await prisma.season.findFirst({ where: { isCurrent: true } });
  const [previousTeam, previousPlayers] = await Promise.all([
    previousSeason ? prisma.team.findUnique({ where: { seasonId: previousSeason.id } }) : null,
    previousSeason ? prisma.player.findMany({ where: { seasonId: previousSeason.id } }) : [],
  ]);

  await prisma.$transaction(async (tx) => {
    await tx.season.updateMany({ data: { isCurrent: false }, where: { isCurrent: true } });
    const season = await tx.season.create({ data: { name: parsed.data.name, isCurrent: true } });
    // Carry forward team identity (name/league/division/coaches) into the new season.
    await tx.team.create({
      data: {
        seasonId: season.id,
        name: previousTeam?.name ?? "New Team",
        league: previousTeam?.league,
        division: previousTeam?.division,
        headCoach: previousTeam?.headCoach,
        assistantCoaches: previousTeam?.assistantCoaches,
      },
    });
    // Carry forward the roster — profile fields only, no stats.
    if (previousPlayers.length > 0) {
      await tx.player.createMany({
        data: previousPlayers.map((p) => ({
          seasonId: season.id,
          firstName: p.firstName,
          lastName: p.lastName,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
          shoots: p.shoots,
        })),
      });
    }
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function switchSeason(seasonId: string): Promise<ActionResult> {
  await setCurrentSeason(seasonId);
  revalidatePath("/", "layout");
  return { ok: true };
}
