-- Create feedback_submissions table with camelCase column names
-- Note: userId is TEXT to match the users table which uses Clerk user IDs
CREATE TABLE IF NOT EXISTS public.feedback_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    userId TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'feedback',
    category TEXT,
    title TEXT,
    message TEXT NOT NULL,
    teamId TEXT,
    teamName TEXT,
    path TEXT,
    priority TEXT,
    includeEmail BOOLEAN DEFAULT false,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_user_id ON public.feedback_submissions(userId);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_type ON public.feedback_submissions(type);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_created_at ON public.feedback_submissions(createdAt);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own feedback submissions
CREATE POLICY "Users can view own feedback submissions" ON public.feedback_submissions
    FOR SELECT USING (auth.uid()::text = userId);

-- Policy: Users can insert their own feedback submissions
CREATE POLICY "Users can insert own feedback submissions" ON public.feedback_submissions
    FOR INSERT WITH CHECK (auth.uid()::text = userId);

-- Policy: Users can update their own feedback submissions
CREATE POLICY "Users can update own feedback submissions" ON public.feedback_submissions
    FOR UPDATE USING (auth.uid()::text = userId);

-- Policy: Users can delete their own feedback submissions
CREATE POLICY "Users can delete own feedback submissions" ON public.feedback_submissions
    FOR DELETE USING (auth.uid()::text = userId);
