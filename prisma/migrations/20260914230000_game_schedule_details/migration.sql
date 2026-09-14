
-- AlterEnum
ALTER TYPE "HomeAway" ADD VALUE 'NEUTRAL';

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "arena" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "specialEvent" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "timeTBA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tournamentName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Game_seasonId_date_opponent_key" ON "Game"("seasonId", "date", "opponent");

