-- Add onboardingCompleted column to users table
-- Run this in your Supabase SQL editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboardingCompleted BOOLEAN DEFAULT false;

-- Update existing users to have onboardingCompleted = false
UPDATE users 
SET onboardingCompleted = false 
WHERE onboardingCompleted IS NULL;
