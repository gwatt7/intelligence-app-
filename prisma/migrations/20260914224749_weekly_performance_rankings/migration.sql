-- CreateEnum
CREATE TYPE "WeeklyRankCategory" AS ENUM ('TOP', 'BOTTOM');

-- CreateTable
CREATE TABLE "WeeklyRanking" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "scoringVersion" TEXT NOT NULL,
    "minEntriesRequired" INTEGER NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyRankingEntry" (
    "id" TEXT NOT NULL,
    "weeklyRankingId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "category" "WeeklyRankCategory" NOT NULL,
    "rank" INTEGER NOT NULL,
    "performanceScore" DOUBLE PRECISION NOT NULL,
    "entriesCount" INTEGER NOT NULL,
    "statsSnapshot" JSONB NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyRankingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyRanking_seasonId_weekStart_key" ON "WeeklyRanking"("seasonId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyRankingEntry_weeklyRankingId_playerId_key" ON "WeeklyRankingEntry"("weeklyRankingId", "playerId");

-- AddForeignKey
ALTER TABLE "WeeklyRanking" ADD CONSTRAINT "WeeklyRanking_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyRankingEntry" ADD CONSTRAINT "WeeklyRankingEntry_weeklyRankingId_fkey" FOREIGN KEY ("weeklyRankingId") REFERENCES "WeeklyRanking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyRankingEntry" ADD CONSTRAINT "WeeklyRankingEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
