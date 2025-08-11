/*
  Warnings:

  - Added the required column `updatedAt` to the `videos` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_videos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "requestedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    "description" TEXT,
    "visibility" TEXT,
    "madeForKids" BOOLEAN NOT NULL DEFAULT false,
    "thumbnailKey" TEXT,
    CONSTRAINT "videos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_videos" ("approvedByUserId", "contentType", "filename", "id", "key", "requestedByUserId", "sizeBytes", "status", "teamId", "uploadedAt", "updatedAt", "userId") SELECT "approvedByUserId", "contentType", "filename", "id", "key", "requestedByUserId", "sizeBytes", "status", "teamId", "uploadedAt", COALESCE("updatedAt", CURRENT_TIMESTAMP), "userId" FROM "videos";
DROP TABLE "videos";
ALTER TABLE "new_videos" RENAME TO "videos";
CREATE INDEX "videos_userId_uploadedAt_idx" ON "videos"("userId", "uploadedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
