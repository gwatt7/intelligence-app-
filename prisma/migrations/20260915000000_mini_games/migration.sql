
-- AlterEnum
BEGIN;
CREATE TYPE "ActivityType_new" AS ENUM ('MINI_GAME_LOGGED', 'GAME_LOGGED', 'PLAYER_UPDATED', 'WAR_ROOM_MISSION_BRIEF', 'WAR_ROOM_AFTER_ACTION');
ALTER TABLE "Activity" ALTER COLUMN "type" TYPE "ActivityType_new" USING ("type"::text::"ActivityType_new");
ALTER TYPE "ActivityType" RENAME TO "ActivityType_old";
ALTER TYPE "ActivityType_new" RENAME TO "ActivityType";
DROP TYPE "public"."ActivityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Practice" DROP CONSTRAINT "Practice_seasonId_fkey";

-- DropForeignKey
ALTER TABLE "PracticePlayerStat" DROP CONSTRAINT "PracticePlayerStat_playerId_fkey";

-- DropForeignKey
ALTER TABLE "PracticePlayerStat" DROP CONSTRAINT "PracticePlayerStat_practiceId_fkey";

-- DropTable
DROP TABLE "Practice";

-- DropTable
DROP TABLE "PracticePlayerStat";

-- CreateTable
CREATE TABLE "MiniGame" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "seasonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiniGame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiniGamePlayerStat" (
    "id" TEXT NOT NULL,
    "miniGameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "zoneEntries" INTEGER NOT NULL DEFAULT 0,
    "successfulZoneEntries" INTEGER NOT NULL DEFAULT 0,
    "zoneExits" INTEGER NOT NULL DEFAULT 0,
    "successfulZoneExits" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "shots" INTEGER NOT NULL DEFAULT 0,
    "scoringChances" INTEGER NOT NULL DEFAULT 0,
    "goodOpportunities" INTEGER NOT NULL DEFAULT 0,
    "badOpportunities" INTEGER NOT NULL DEFAULT 0,
    "disruptions" INTEGER NOT NULL DEFAULT 0,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "blocks" INTEGER NOT NULL DEFAULT 0,
    "takeaways" INTEGER NOT NULL DEFAULT 0,
    "giveaways" INTEGER NOT NULL DEFAULT 0,
    "shotsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MiniGamePlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MiniGamePlayerStat_miniGameId_playerId_key" ON "MiniGamePlayerStat"("miniGameId", "playerId");

-- AddForeignKey
ALTER TABLE "MiniGame" ADD CONSTRAINT "MiniGame_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiniGamePlayerStat" ADD CONSTRAINT "MiniGamePlayerStat_miniGameId_fkey" FOREIGN KEY ("miniGameId") REFERENCES "MiniGame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiniGamePlayerStat" ADD CONSTRAINT "MiniGamePlayerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

