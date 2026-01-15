-- Migration: Remove unused enum values from VideoStatus
-- This creates a new clean enum and migrates data
-- Run this AFTER the previous migration (001) has been applied

-- ============================================
-- STEP 1: Create new clean enum type
-- ============================================
CREATE TYPE "VideoStatus_new" AS ENUM (
  'PROCESSING',
  'READY_TO_PUBLISH',
  'APPROVAL_REQUESTED',
  'APPROVAL_APPROVED',
  'POSTED',
  'SCHEDULED'
);

-- ============================================
-- STEP 2: Migrate existing data to new enum
-- ============================================
-- Add a temporary column with the new enum type
ALTER TABLE video_posts 
ADD COLUMN status_new "VideoStatus_new";

-- Map old values to new values
UPDATE video_posts 
SET status_new = CASE
  WHEN status::text = 'PROCESSING' THEN 'PROCESSING'::"VideoStatus_new"
  WHEN status::text = 'READY_TO_PUBLISH' THEN 'READY_TO_PUBLISH'::"VideoStatus_new"
  WHEN status::text = 'APPROVAL_REQUESTED' THEN 'APPROVAL_REQUESTED'::"VideoStatus_new"
  WHEN status::text = 'APPROVAL_APPROVED' THEN 'APPROVAL_APPROVED'::"VideoStatus_new"
  WHEN status::text = 'POSTED' THEN 'POSTED'::"VideoStatus_new"
  WHEN status::text = 'PUBLISHED' THEN 'POSTED'::"VideoStatus_new"  -- Map PUBLISHED to POSTED
  WHEN status::text = 'SCHEDULED' THEN 'SCHEDULED'::"VideoStatus_new"
  WHEN status::text = 'PENDING' THEN 
    CASE
      WHEN "approvedByUserId" IS NOT NULL THEN 'APPROVAL_APPROVED'::"VideoStatus_new"
      WHEN "requestedByUserId" IS NOT NULL THEN 'APPROVAL_REQUESTED'::"VideoStatus_new"
      ELSE 'READY_TO_PUBLISH'::"VideoStatus_new"
    END
  WHEN status::text = 'DRAFT' THEN 'PROCESSING'::"VideoStatus_new"  -- Map DRAFT to PROCESSING
  WHEN status::text = 'READY' THEN 'READY_TO_PUBLISH'::"VideoStatus_new"  -- Map READY to READY_TO_PUBLISH
  ELSE 'PROCESSING'::"VideoStatus_new"  -- Default fallback
END;

-- ============================================
-- STEP 3: Replace old enum with new one
-- ============================================
-- Drop the old column
ALTER TABLE video_posts DROP COLUMN status;

-- Rename the new column
ALTER TABLE video_posts RENAME COLUMN status_new TO status;

-- Make it NOT NULL if it was before
ALTER TABLE video_posts ALTER COLUMN status SET NOT NULL;

-- ============================================
-- STEP 4: Check for other tables using VideoStatus (run this first to verify)
-- ============================================
-- Run this query to see if any other tables use VideoStatus:
-- SELECT 
--   t.typname as enum_name,
--   a.attname as column_name,
--   c.relname as table_name
-- FROM pg_type t 
-- JOIN pg_enum e ON t.oid = e.enumtypid  
-- JOIN pg_attribute a ON a.atttypid = t.oid
-- JOIN pg_class c ON a.attrelid = c.oid
-- WHERE t.typname = 'VideoStatus'
-- GROUP BY t.typname, a.attname, c.relname;

-- ============================================
-- STEP 5: Drop old enum and rename new one
-- ============================================
-- Drop the old enum type (this will fail if other tables use it)
-- If you get an error, you'll need to migrate those tables first
DROP TYPE "VideoStatus";

-- Rename the new enum to the original name
ALTER TYPE "VideoStatus_new" RENAME TO "VideoStatus";

-- ============================================
-- Verification query (optional - run to check results)
-- ============================================
-- SELECT status, COUNT(*) 
-- FROM video_posts 
-- GROUP BY status 
-- ORDER BY status;

