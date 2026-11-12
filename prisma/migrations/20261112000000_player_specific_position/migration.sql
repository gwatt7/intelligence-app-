-- CreateEnum
CREATE TYPE "SpecificPosition" AS ENUM ('C', 'LW', 'RW', 'LD', 'RD', 'G');

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "primaryPosition" "SpecificPosition",
ADD COLUMN     "secondaryPosition" "SpecificPosition";
