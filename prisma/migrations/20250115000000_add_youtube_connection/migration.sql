-- AlterTable
ALTER TABLE "users" ADD COLUMN "youtubeAccessToken" TEXT,
ADD COLUMN "youtubeRefreshToken" TEXT,
ADD COLUMN "youtubeExpiresAt" TIMESTAMP(3),
ADD COLUMN "youtubeChannelId" TEXT,
ADD COLUMN "youtubeChannelTitle" TEXT;
