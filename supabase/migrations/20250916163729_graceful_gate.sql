-- Fix onboarding column and ensure it exists with correct data type
-- Run this in your Supabase SQL editor

-- First, check if the column exists and add it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'onboardingcompleted'
  ) THEN
    ALTER TABLE users ADD COLUMN onboardingcompleted BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Ensure all existing users have onboardingcompleted = true (they're already using the system)
UPDATE users 
SET onboardingcompleted = true 
WHERE onboardingcompleted IS NULL OR onboardingcompleted = false;

-- Only new users (created after this fix) should have onboardingcompleted = false
-- This will be handled by the webhook for new signups