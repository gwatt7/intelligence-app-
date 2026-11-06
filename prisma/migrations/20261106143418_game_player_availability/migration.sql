-- CreateEnum
CREATE TYPE "GameAvailabilityStatus" AS ENUM ('SCRATCHED', 'INJURED');

-- CreateTable
CREATE TABLE "GamePlayerAvailability" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "GameAvailabilityStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamePlayerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GamePlayerAvailability_gameId_playerId_key" ON "GamePlayerAvailability"("gameId", "playerId");

-- AddForeignKey
ALTER TABLE "GamePlayerAvailability" ADD CONSTRAINT "GamePlayerAvailability_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayerAvailability" ADD CONSTRAINT "GamePlayerAvailability_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
