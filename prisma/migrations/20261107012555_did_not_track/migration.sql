-- AlterTable
ALTER TABLE "GamePlayerStat" ADD COLUMN     "untrackedFields" TEXT[] DEFAULT ARRAY[]::TEXT[];
