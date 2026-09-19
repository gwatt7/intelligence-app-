-- AlterTable
ALTER TABLE "GamePlayerStat" ADD COLUMN     "faceoffsLost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "faceoffsWon" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MiniGamePlayerStat" ADD COLUMN     "faceoffsLost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "faceoffsWon" INTEGER NOT NULL DEFAULT 0;
