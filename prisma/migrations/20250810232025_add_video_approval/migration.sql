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
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "requestedByUserId" TEXT,
    "approvedByUserId" TEXT,
    "userId" TEXT NOT NULL,
    "teamId" TEXT,
    CONSTRAINT "videos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_videos" ("contentType", "filename", "id", "key", "sizeBytes", "teamId", "uploadedAt", "userId") SELECT "contentType", "filename", "id", "key", "sizeBytes", "teamId", "uploadedAt", "userId" FROM "videos";
DROP TABLE "videos";
ALTER TABLE "new_videos" RENAME TO "videos";
CREATE INDEX "videos_userId_uploadedAt_idx" ON "videos"("userId", "uploadedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
