-- CreateEnum
CREATE TYPE "Position" AS ENUM ('FORWARD', 'DEFENSE', 'GOALIE');

-- CreateEnum
CREATE TYPE "Shoots" AS ENUM ('LEFT', 'RIGHT');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'INJURED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('PRESEASON', 'REGULAR_SEASON', 'PLAYOFFS');

-- CreateEnum
CREATE TYPE "HomeAway" AS ENUM ('HOME', 'AWAY');

-- CreateEnum
CREATE TYPE "ObjectiveMetric" AS ENUM ('GIVEAWAYS', 'TAKEAWAYS', 'ZONE_ENTRY_PCT', 'ZONE_EXIT_PCT', 'SCORING_CHANCES', 'GOALS', 'SHOTS', 'HITS', 'BLOCKS', 'DISRUPTIONS');

-- CreateEnum
CREATE TYPE "ObjectiveComparator" AS ENUM ('LESS_THAN_OR_EQUAL', 'GREATER_THAN_OR_EQUAL');

-- CreateEnum
CREATE TYPE "ObjectiveStatus" AS ENUM ('ACHIEVED', 'PARTIALLY_ACHIEVED', 'NOT_ACHIEVED');

-- CreateEnum
CREATE TYPE "HighlightCategory" AS ENUM ('PLAYER_OF_THE_GAME', 'BEST_OFFENSIVE_PERFORMANCE', 'BEST_DEFENSIVE_PERFORMANCE', 'UNSUNG_HERO', 'GOALIE_PERFORMANCE');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('PRACTICE_LOGGED', 'GAME_LOGGED', 'PLAYER_UPDATED', 'WAR_ROOM_MISSION_BRIEF', 'WAR_ROOM_AFTER_ACTION');

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "league" TEXT,
    "division" TEXT,
    "headCoach" TEXT,
    "assistantCoaches" TEXT,
    "seasonId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "jerseyNumber" INTEGER NOT NULL,
    "position" "Position" NOT NULL,
    "shoots" "Shoots",
    "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "seasonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSeasonStat" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "source" TEXT,
    "gamesPlayed" INTEGER,
    "timeOnIceSeconds" INTEGER,
    "corsiForPct" DOUBLE PRECISION,
    "puckTouches" INTEGER,
    "faceoffWinPct" DOUBLE PRECISION,
    "faceoffWinPctDZ" DOUBLE PRECISION,
    "faceoffWinPctNZ" DOUBLE PRECISION,
    "faceoffWinPctOZ" DOUBLE PRECISION,
    "goals" INTEGER,
    "assists" INTEGER,
    "takeaways" INTEGER,
    "giveaways" INTEGER,
    "scoringChances" INTEGER,
    "shots" INTEGER,
    "shotsOnGoal" INTEGER,
    "expectedGoals" DOUBLE PRECISION,
    "accuratePassPct" DOUBLE PRECISION,
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
    "savePct" DOUBLE PRECISION,
    "shootoutSaves" INTEGER,
    "shootoutsAllowed" INTEGER,
    "scoringChancesAgainst" INTEGER,
    "scoringChanceSaves" INTEGER,
    "scoringChanceSavePct" DOUBLE PRECISION,
    "rawStats" JSONB,
    "coachNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerSeasonStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Practice" (
    "id" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "focus" TEXT,
    "notes" TEXT,
    "seasonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Practice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticePlayerStat" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PracticePlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "gameType" "GameType" NOT NULL,
    "opponent" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "homeAway" "HomeAway" NOT NULL,
    "location" TEXT,
    "ourScore" INTEGER,
    "opponentScore" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "whatWentWell" TEXT,
    "whatWentWrong" TEXT,
    "coachNotes" TEXT,
    "seasonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePlayerStat" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GamePlayerStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarRoom" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "opponentStrengths" TEXT,
    "opponentWeaknesses" TEXT,
    "opponentHabits" TEXT,
    "keysToVictory" TEXT,
    "missionBriefSavedAt" TIMESTAMP(3),
    "whatWentWell" TEXT,
    "whatWentWrong" TEXT,
    "lessonsLearned" TEXT,
    "changesToMake" TEXT,
    "keepDoing" TEXT,
    "afterActionSavedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" TEXT NOT NULL,
    "warRoomId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "metric" "ObjectiveMetric",
    "target" DOUBLE PRECISION,
    "comparator" "ObjectiveComparator",
    "manualStatus" "ObjectiveStatus",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerHighlight" (
    "id" TEXT NOT NULL,
    "warRoomId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "category" "HighlightCategory" NOT NULL,

    CONSTRAINT "PlayerHighlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "message" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Season_name_key" ON "Season"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Team_seasonId_key" ON "Team"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Player_seasonId_jerseyNumber_key" ON "Player"("seasonId", "jerseyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonStat_playerId_seasonId_key" ON "PlayerSeasonStat"("playerId", "seasonId");

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

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStat" ADD CONSTRAINT "PlayerSeasonStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStat" ADD CONSTRAINT "PlayerSeasonStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Practice" ADD CONSTRAINT "Practice_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePlayerStat" ADD CONSTRAINT "PracticePlayerStat_practiceId_fkey" FOREIGN KEY ("practiceId") REFERENCES "Practice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticePlayerStat" ADD CONSTRAINT "PracticePlayerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayerStat" ADD CONSTRAINT "GamePlayerStat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayerStat" ADD CONSTRAINT "GamePlayerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarRoom" ADD CONSTRAINT "WarRoom_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_warRoomId_fkey" FOREIGN KEY ("warRoomId") REFERENCES "WarRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerHighlight" ADD CONSTRAINT "PlayerHighlight_warRoomId_fkey" FOREIGN KEY ("warRoomId") REFERENCES "WarRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerHighlight" ADD CONSTRAINT "PlayerHighlight_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;
