-- Add onboardingCompleted column to users table
-- Run this in your Supabase SQL editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboardingCompleted BOOLEAN DEFAULT false;

-- Track if user has ever seen onboarding (so it won't show again automatically)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboardingSeenAt TIMESTAMPTZ;

-- Track if user skipped onboarding (explicit skip)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboardingSkipped BOOLEAN DEFAULT false;

-- Update existing users to have onboardingCompleted = false
UPDATE users 
SET onboardingCompleted = false 
WHERE onboardingCompleted IS NULL;

-- Backfill onboardingSkipped for existing rows
UPDATE users
SET onboardingSkipped = false
WHERE onboardingSkipped IS NULL;
