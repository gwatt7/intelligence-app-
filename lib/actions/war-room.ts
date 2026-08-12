"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import type { ActionResult } from "./team";
export type { ActionResult };
import type { $Enums } from "@/app/generated/prisma/client";

export interface ObjectiveDraft {
  text: string;
  metric?: $Enums.ObjectiveMetric | null;
  comparator?: $Enums.ObjectiveComparator | null;
  target?: number | null;
}

export interface MissionBriefPayload {
  opponentStrengths: string;
  opponentWeaknesses: string;
  opponentHabits: string;
  keysToVictory: string;
  objectives: ObjectiveDraft[];
}

/** Creates or replaces the Mission Brief for a game. Objectives are fully replaced on each save — simplest correct behavior for a form that edits a whole list at once. */
export async function saveMissionBrief(gameId: string, payload: MissionBriefPayload): Promise<ActionResult> {
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return { ok: false, error: "Game not found" };

  const cleanObjectives = payload.objectives
    .map((o) => ({ ...o, text: o.text.trim() }))
    .filter((o) => o.text.length > 0);

  await prisma.$transaction(async (tx) => {
    const warRoom = await tx.warRoom.upsert({
      where: { gameId },
      create: {
        gameId,
        opponentStrengths: payload.opponentStrengths.trim() || null,
        opponentWeaknesses: payload.opponentWeaknesses.trim() || null,
        opponentHabits: payload.opponentHabits.trim() || null,
        keysToVictory: payload.keysToVictory.trim() || null,
        missionBriefSavedAt: new Date(),
      },
      update: {
        opponentStrengths: payload.opponentStrengths.trim() || null,
        opponentWeaknesses: payload.opponentWeaknesses.trim() || null,
        opponentHabits: payload.opponentHabits.trim() || null,
        keysToVictory: payload.keysToVictory.trim() || null,
        missionBriefSavedAt: new Date(),
      },
    });

    await tx.objective.deleteMany({ where: { warRoomId: warRoom.id } });
    for (let i = 0; i < cleanObjectives.length; i++) {
      const o = cleanObjectives[i];
      await tx.objective.create({
        data: {
          warRoomId: warRoom.id,
          text: o.text,
          order: i,
          metric: o.metric || null,
          comparator: o.comparator || null,
          target: o.target ?? null,
        },
      });
    }
  });

  await logActivity(game.seasonId, "WAR_ROOM_MISSION_BRIEF", `Mission Brief saved for game vs ${game.opponent}`);

  revalidatePath(`/war-room/${gameId}`);
  revalidatePath("/war-room");
  revalidatePath("/");
  return { ok: true };
}

export interface HighlightDraft {
  category: $Enums.HighlightCategory;
  playerId: string | null;
}

export interface AfterActionPayload {
  whatWentWell: string;
  whatWentWrong: string;
  lessonsLearned: string;
  changesToMake: string;
  keepDoing: string;
  highlights: HighlightDraft[];
  objectiveOverrides: { objectiveId: string; manualStatus: $Enums.ObjectiveStatus | null }[];
}

export async function saveAfterActionReport(gameId: string, payload: AfterActionPayload): Promise<ActionResult> {
  const game = await prisma.game.findUnique({ where: { id: gameId }, include: { warRoom: true } });
  if (!game) return { ok: false, error: "Game not found" };

  const warRoomId = game.warRoom
    ? game.warRoom.id
    : (await prisma.warRoom.create({ data: { gameId } })).id;

  await prisma.$transaction(async (tx) => {
    await tx.warRoom.update({
      where: { id: warRoomId },
      data: {
        whatWentWell: payload.whatWentWell.trim() || null,
        whatWentWrong: payload.whatWentWrong.trim() || null,
        lessonsLearned: payload.lessonsLearned.trim() || null,
        changesToMake: payload.changesToMake.trim() || null,
        keepDoing: payload.keepDoing.trim() || null,
        afterActionSavedAt: new Date(),
      },
    });

    await tx.playerHighlight.deleteMany({ where: { warRoomId } });
    for (const h of payload.highlights) {
      if (!h.playerId) continue;
      await tx.playerHighlight.create({ data: { warRoomId, category: h.category, playerId: h.playerId } });
    }

    for (const o of payload.objectiveOverrides) {
      await tx.objective.update({ where: { id: o.objectiveId }, data: { manualStatus: o.manualStatus } });
    }
  });

  await logActivity(game.seasonId, "WAR_ROOM_AFTER_ACTION", `After Action Report completed for game vs ${game.opponent}`);

  revalidatePath(`/war-room/${gameId}`);
  revalidatePath("/war-room");
  revalidatePath("/");
  return { ok: true };
}
