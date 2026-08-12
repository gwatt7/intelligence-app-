-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "league" TEXT,
    "division" TEXT,
    "headCoach" TEXT,
    "assistantCoaches" TEXT,
    "seasonId" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Team_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "jerseyNumber" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "shoots" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "seasonId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Practice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "week" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "location" TEXT,
    "focus" TEXT,
    "notes" TEXT,
    "seasonId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Practice_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticePlayerStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "practiceId" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PracticePlayerStat_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PracticePlayerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameType" TEXT NOT NULL,
    "opponent" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "homeAway" TEXT NOT NULL,
    "location" TEXT,
    "ourScore" INTEGER,
    "opponentScore" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "whatWentWell" TEXT,
    "whatWentWrong" TEXT,
    "coachNotes" TEXT,
    "seasonId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Game_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GamePlayerStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GamePlayerStat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GamePlayerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WarRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "opponentStrengths" TEXT,
    "opponentWeaknesses" TEXT,
    "opponentHabits" TEXT,
    "keysToVictory" TEXT,
    "missionBriefSavedAt" DATETIME,
    "whatWentWell" TEXT,
    "whatWentWrong" TEXT,
    "lessonsLearned" TEXT,
    "changesToMake" TEXT,
    "keepDoing" TEXT,
    "afterActionSavedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WarRoom_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warRoomId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metric" TEXT,
    "target" REAL,
    "comparator" TEXT,
    "manualStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Objective_warRoomId_fkey" FOREIGN KEY ("warRoomId") REFERENCES "WarRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayerHighlight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "warRoomId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    CONSTRAINT "PlayerHighlight_warRoomId_fkey" FOREIGN KEY ("warRoomId") REFERENCES "WarRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlayerHighlight_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Season_name_key" ON "Season"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_seasonId_key" ON "Team"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_seasonId_jerseyNumber_key" ON "Player"("seasonId", "jerseyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Practice_seasonId_number_key" ON "Practice"("seasonId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "PracticePlayerStat_practiceId_playerId_key" ON "PracticePlayerStat"("practiceId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "GamePlayerStat_gameId_playerId_key" ON "GamePlayerStat"("gameId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "WarRoom_gameId_key" ON "WarRoom"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerHighlight_warRoomId_category_key" ON "PlayerHighlight"("warRoomId", "category");
