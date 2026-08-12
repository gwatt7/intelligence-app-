import { z } from "zod";

export const seasonSchema = z.object({
  name: z.string().trim().min(1, "Season name is required"),
});

export const teamInfoSchema = z.object({
  name: z.string().trim().min(1, "Team name is required"),
  league: z.string().trim().optional(),
  division: z.string().trim().optional(),
  headCoach: z.string().trim().optional(),
  assistantCoaches: z.string().trim().optional(),
});

export const playerSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  jerseyNumber: z.coerce.number().int().min(0, "Jersey number can't be negative").max(99, "Jersey number must be 0-99"),
  position: z.enum(["FORWARD", "DEFENSE", "GOALIE"]),
  shoots: z.enum(["LEFT", "RIGHT"]),
  status: z.enum(["ACTIVE", "INJURED", "UNAVAILABLE"]).default("ACTIVE"),
});

const nonNegativeInt = z.coerce.number().int().min(0, "Must be zero or greater");

export const statLineSchema = z
  .object({
    zoneEntries: nonNegativeInt.default(0),
    successfulZoneEntries: nonNegativeInt.default(0),
    zoneExits: nonNegativeInt.default(0),
    successfulZoneExits: nonNegativeInt.default(0),
    goals: nonNegativeInt.default(0),
    assists: nonNegativeInt.default(0),
    shots: nonNegativeInt.default(0),
    scoringChances: nonNegativeInt.default(0),
    goodOpportunities: nonNegativeInt.default(0),
    badOpportunities: nonNegativeInt.default(0),
    disruptions: nonNegativeInt.default(0),
    hits: nonNegativeInt.default(0),
    blocks: nonNegativeInt.default(0),
    takeaways: nonNegativeInt.default(0),
    giveaways: nonNegativeInt.default(0),
    shotsAgainst: nonNegativeInt.default(0),
    goalsAgainst: nonNegativeInt.default(0),
    saves: nonNegativeInt.default(0),
  })
  .refine((s) => s.successfulZoneEntries <= s.zoneEntries, {
    message: "Successful zone entries can't exceed total zone entries",
    path: ["successfulZoneEntries"],
  })
  .refine((s) => s.successfulZoneExits <= s.zoneExits, {
    message: "Successful zone exits can't exceed total zone exits",
    path: ["successfulZoneExits"],
  })
  .refine((s) => s.saves <= s.shotsAgainst, {
    message: "Saves can't exceed shots against",
    path: ["saves"],
  });

export const practiceSchema = z.object({
  week: z.coerce.number().int().min(1, "Week must be 1 or greater"),
  number: z.coerce.number().int().min(1, "Practice number must be 1 or greater"),
  date: z.string().min(1, "Date is required"),
  location: z.string().trim().optional(),
  focus: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const gameSchema = z.object({
  gameType: z.enum(["PRESEASON", "REGULAR_SEASON", "PLAYOFFS"]),
  opponent: z.string().trim().min(1, "Opponent is required"),
  date: z.string().min(1, "Date is required"),
  homeAway: z.enum(["HOME", "AWAY"]),
  location: z.string().trim().optional(),
  ourScore: z.coerce.number().int().min(0).optional().nullable(),
  opponentScore: z.coerce.number().int().min(0).optional().nullable(),
});

export const missionBriefSchema = z.object({
  opponentStrengths: z.string().trim().optional(),
  opponentWeaknesses: z.string().trim().optional(),
  opponentHabits: z.string().trim().optional(),
  keysToVictory: z.string().trim().optional(),
});

export const objectiveSchema = z.object({
  text: z.string().trim().min(1, "Objective text is required"),
  metric: z
    .enum([
      "GIVEAWAYS",
      "TAKEAWAYS",
      "ZONE_ENTRY_PCT",
      "ZONE_EXIT_PCT",
      "SCORING_CHANCES",
      "GOALS",
      "SHOTS",
      "HITS",
      "BLOCKS",
      "DISRUPTIONS",
    ])
    .optional()
    .nullable(),
  comparator: z.enum(["LESS_THAN_OR_EQUAL", "GREATER_THAN_OR_EQUAL"]).optional().nullable(),
  target: z.coerce.number().optional().nullable(),
});

export const afterActionSchema = z.object({
  whatWentWell: z.string().trim().optional(),
  whatWentWrong: z.string().trim().optional(),
  lessonsLearned: z.string().trim().optional(),
  changesToMake: z.string().trim().optional(),
  keepDoing: z.string().trim().optional(),
});

export type PlayerInput = z.infer<typeof playerSchema>;
export type StatLineInput = z.infer<typeof statLineSchema>;
export type PracticeInput = z.infer<typeof practiceSchema>;
export type GameInput = z.infer<typeof gameSchema>;
