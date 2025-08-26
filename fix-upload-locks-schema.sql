-- Fix upload_locks table schema
-- Add missing metadata column and ensure all columns are camelCase

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'upload_locks' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.upload_locks ADD COLUMN metadata TEXT;
    END IF;
END $$;

-- Ensure all columns are camelCase
DO $$ 
BEGIN
    -- Rename columns to camelCase if they exist in snake_case
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'upload_locks' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.upload_locks RENAME COLUMN user_id TO "userId";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'upload_locks' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.upload_locks RENAME COLUMN created_at TO "createdAt";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'upload_locks' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.upload_locks RENAME COLUMN updated_at TO "updatedAt";
    END IF;
END $$;

-- Update indexes to use camelCase column names
DROP INDEX IF EXISTS idx_upload_locks_user_id;
CREATE INDEX IF NOT EXISTS idx_upload_locks_user_id ON public.upload_locks("userId");

-- Add RLS policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'upload_locks' 
        AND policyname = 'Users can view their own upload locks'
    ) THEN
        CREATE POLICY "Users can view their own upload locks" ON public.upload_locks
            FOR SELECT USING (auth.uid()::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'upload_locks' 
        AND policyname = 'Users can insert their own upload locks'
    ) THEN
        CREATE POLICY "Users can insert their own upload locks" ON public.upload_locks
            FOR INSERT WITH CHECK (auth.uid()::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'upload_locks' 
        AND policyname = 'Users can update their own upload locks'
    ) THEN
        CREATE POLICY "Users can update their own upload locks" ON public.upload_locks
            FOR UPDATE USING (auth.uid()::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'upload_locks' 
        AND policyname = 'Users can delete their own upload locks'
    ) THEN
        CREATE POLICY "Users can delete their own upload locks" ON public.upload_locks
            FOR DELETE USING (auth.uid()::text = "userId");
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.upload_locks ENABLE ROW LEVEL SECURITY;
