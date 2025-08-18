/*
  # Add Personal Workspace Support

  1. Schema Changes
    - Add `isPersonal` boolean field to teams table
    - Add `personalTeamId` field to users table for quick lookup
    - Update constraints to allow personal teams

  2. Data Migration
    - Create personal teams for existing users
    - Update user records with personal team references

  3. Indexes
    - Add index for personal team lookups
    - Optimize team queries
*/

-- Add isPersonal field to teams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'isPersonal'
  ) THEN
    ALTER TABLE teams ADD COLUMN "isPersonal" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add personalTeamId field to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'personalTeamId'
  ) THEN
    ALTER TABLE users ADD COLUMN "personalTeamId" TEXT;
  END IF;
END $$;

-- Create personal teams for existing users who don't have one
DO $$
DECLARE
  user_record RECORD;
  personal_team_id TEXT;
BEGIN
  FOR user_record IN 
    SELECT id, name, email 
    FROM users 
    WHERE "personalTeamId" IS NULL
  LOOP
    -- Generate a unique ID for the personal team
    personal_team_id := 'personal_' || user_record.id;
    
    -- Create personal team
    INSERT INTO teams (id, name, description, "ownerId", "isPersonal", "createdAt", "updatedAt")
    VALUES (
      personal_team_id,
      COALESCE(user_record.name, 'Personal') || '''s Workspace',
      'Your personal video workspace',
      user_record.id,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Update user with personal team reference
    UPDATE users 
    SET "personalTeamId" = personal_team_id,
        "updatedAt" = NOW()
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Add foreign key constraint for personalTeamId
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_personalTeamId_fkey'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT "users_personalTeamId_fkey" 
    FOREIGN KEY ("personalTeamId") REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for personal team lookups
CREATE INDEX IF NOT EXISTS "teams_isPersonal_ownerId_idx" ON teams("isPersonal", "ownerId");
CREATE INDEX IF NOT EXISTS "users_personalTeamId_idx" ON users("personalTeamId");

-- Update existing videos without teamId to use personal teams
UPDATE videos 
SET "teamId" = (
  SELECT "personalTeamId" 
  FROM users 
  WHERE users.id = videos."userId"
),
"updatedAt" = NOW()
WHERE "teamId" IS NULL 
AND EXISTS (
  SELECT 1 FROM users 
  WHERE users.id = videos."userId" 
  AND users."personalTeamId" IS NOT NULL
);