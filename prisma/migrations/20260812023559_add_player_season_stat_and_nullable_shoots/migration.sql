-- CreateTable
CREATE TABLE "PlayerSeasonStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "source" TEXT,
    "gamesPlayed" INTEGER,
    "timeOnIceSeconds" INTEGER,
    "corsiForPct" REAL,
    "puckTouches" INTEGER,
    "faceoffWinPct" REAL,
    "faceoffWinPctDZ" REAL,
    "faceoffWinPctNZ" REAL,
    "faceoffWinPctOZ" REAL,
    "goals" INTEGER,
    "assists" INTEGER,
    "takeaways" INTEGER,
    "giveaways" INTEGER,
    "scoringChances" INTEGER,
    "shots" INTEGER,
    "shotsOnGoal" INTEGER,
    "expectedGoals" REAL,
    "accuratePassPct" REAL,
    "zoneEntries" INTEGER,
    "breakouts" INTEGER,
    "hits" INTEGER,
    "blocks" INTEGER,
    "plusMinus" INTEGER,
    "powerPlayOpportunities" INTEGER,
    "powerPlaySuccessful" INTEGER,
    "powerPlayTimeSeconds" INTEGER,
    "goalsAgainst" INTEGER,
    "shotsAgainst" INTEGER,
    "saves" INTEGER,
    "savePct" REAL,
    "shootoutSaves" INTEGER,
    "shootoutsAllowed" INTEGER,
    "scoringChancesAgainst" INTEGER,
    "scoringChanceSaves" INTEGER,
    "scoringChanceSavePct" REAL,
    "rawStats" JSONB,
    "coachNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PlayerSeasonStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlayerSeasonStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "jerseyNumber" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "shoots" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "seasonId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("createdAt", "firstName", "id", "jerseyNumber", "lastName", "position", "seasonId", "shoots", "status", "updatedAt") SELECT "createdAt", "firstName", "id", "jerseyNumber", "lastName", "position", "seasonId", "shoots", "status", "updatedAt" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_seasonId_jerseyNumber_key" ON "Player"("seasonId", "jerseyNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonStat_playerId_seasonId_key" ON "PlayerSeasonStat"("playerId", "seasonId");
