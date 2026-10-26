-- CreateEnum
CREATE TYPE "GameSituation" AS ENUM ('POWER_PLAY', 'PENALTY_KILL');

-- CreateTable
CREATE TABLE "GameSituationStat" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "situation" "GameSituation" NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "shots" INTEGER NOT NULL DEFAULT 0,
    "shotAttempts" INTEGER NOT NULL DEFAULT 0,
    "timeOnIceSeconds" INTEGER NOT NULL DEFAULT 0,
    "blocks" INTEGER NOT NULL DEFAULT 0,
    "clears" INTEGER NOT NULL DEFAULT 0,
    "faceoffsWon" INTEGER NOT NULL DEFAULT 0,
    "faceoffsLost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSituationStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameSituationStat_gameId_playerId_situation_key" ON "GameSituationStat"("gameId", "playerId", "situation");

-- AddForeignKey
ALTER TABLE "GameSituationStat" ADD CONSTRAINT "GameSituationStat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSituationStat" ADD CONSTRAINT "GameSituationStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
