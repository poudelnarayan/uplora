-- Fix YouTube columns to use camelCase
-- Convert from snake_case to camelCase

-- Rename YouTube columns in users table
ALTER TABLE public.users 
RENAME COLUMN youtube_access_token TO "youtubeAccessToken";

ALTER TABLE public.users 
RENAME COLUMN youtube_refresh_token TO "youtubeRefreshToken";

ALTER TABLE public.users 
RENAME COLUMN youtube_expires_at TO "youtubeExpiresAt";

ALTER TABLE public.users 
RENAME COLUMN youtube_channel_id TO "youtubeChannelId";

ALTER TABLE public.users 
RENAME COLUMN youtube_channel_title TO "youtubeChannelTitle";

-- Also fix other columns to be consistent with camelCase
ALTER TABLE public.users 
RENAME COLUMN clerk_id TO "clerkId";

ALTER TABLE public.users 
RENAME COLUMN personal_team_id TO "personalTeamId";

ALTER TABLE public.users 
RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.users 
RENAME COLUMN updated_at TO "updatedAt";

-- Fix teams table columns
ALTER TABLE public.teams 
RENAME COLUMN is_personal TO "isPersonal";

ALTER TABLE public.teams 
RENAME COLUMN owner_id TO "ownerId";

ALTER TABLE public.teams 
RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.teams 
RENAME COLUMN updated_at TO "updatedAt";

-- Fix team_members table columns
ALTER TABLE public.team_members 
RENAME COLUMN joined_at TO "joinedAt";

ALTER TABLE public.team_members 
RENAME COLUMN updated_at TO "updatedAt";

ALTER TABLE public.team_members 
RENAME COLUMN user_id TO "userId";

ALTER TABLE public.team_members 
RENAME COLUMN team_id TO "teamId";

-- Fix team_invites table columns
ALTER TABLE public.team_invites 
RENAME COLUMN expires_at TO "expiresAt";

ALTER TABLE public.team_invites 
RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.team_invites 
RENAME COLUMN updated_at TO "updatedAt";

ALTER TABLE public.team_invites 
RENAME COLUMN team_id TO "teamId";

ALTER TABLE public.team_invites 
RENAME COLUMN inviter_id TO "inviterId";

ALTER TABLE public.team_invites 
RENAME COLUMN invitee_id TO "inviteeId";

-- Fix videos table columns
ALTER TABLE public.videos 
RENAME COLUMN content_type TO "contentType";

ALTER TABLE public.videos 
RENAME COLUMN size_bytes TO "sizeBytes";

ALTER TABLE public.videos 
RENAME COLUMN uploaded_at TO "uploadedAt";

ALTER TABLE public.videos 
RENAME COLUMN updated_at TO "updatedAt";

ALTER TABLE public.videos 
RENAME COLUMN requested_by_user_id TO "requestedByUserId";

ALTER TABLE public.videos 
RENAME COLUMN approved_by_user_id TO "approvedByUserId";

ALTER TABLE public.videos 
RENAME COLUMN user_id TO "userId";

ALTER TABLE public.videos 
RENAME COLUMN team_id TO "teamId";

ALTER TABLE public.videos 
RENAME COLUMN made_for_kids TO "madeForKids";

ALTER TABLE public.videos 
RENAME COLUMN thumbnail_key TO "thumbnailKey";

-- Fix upload_locks table columns
ALTER TABLE public.upload_locks 
RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.upload_locks 
RENAME COLUMN updated_at TO "updatedAt";

ALTER TABLE public.upload_locks 
RENAME COLUMN user_id TO "userId";

-- Update indexes to use new column names
DROP INDEX IF EXISTS idx_users_clerk_id;
CREATE INDEX idx_users_clerk_id ON public.users("clerkId");

DROP INDEX IF EXISTS idx_teams_owner_id;
CREATE INDEX idx_teams_owner_id ON public.teams("ownerId");

DROP INDEX IF EXISTS idx_teams_is_personal;
CREATE INDEX idx_teams_is_personal ON public.teams("isPersonal");

DROP INDEX IF EXISTS idx_team_members_user_id;
CREATE INDEX idx_team_members_user_id ON public.team_members("userId");

DROP INDEX IF EXISTS idx_team_members_team_id;
CREATE INDEX idx_team_members_team_id ON public.team_members("teamId");

DROP INDEX IF EXISTS idx_team_invites_team_id;
CREATE INDEX idx_team_invites_team_id ON public.team_invites("teamId");

-- Add new indexes for YouTube columns
CREATE INDEX IF NOT EXISTS idx_users_youtube_channel_id ON public.users("youtubeChannelId");
CREATE INDEX IF NOT EXISTS idx_users_youtube_access_token ON public.users("youtubeAccessToken");
