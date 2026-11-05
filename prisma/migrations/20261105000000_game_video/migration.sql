-- CreateTable
CREATE TABLE "GameVideo" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "durationSeconds" INTEGER,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameVideo_gameId_key" ON "GameVideo"("gameId");

-- AddForeignKey
ALTER TABLE "GameVideo" ADD CONSTRAINT "GameVideo_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
