import { prisma } from "./db";
import type { $Enums } from "@/app/generated/prisma/client";

export async function logActivity(
  seasonId: string,
  type: $Enums.ActivityType,
  message: string
) {
  await prisma.activity.create({ data: { seasonId, type, message } });
}
