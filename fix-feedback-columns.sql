-- Fix column names to use camelCase
ALTER TABLE public.feedback_submissions 
RENAME COLUMN includeemail TO "includeEmail";

-- Also check and fix other columns if they're not in camelCase
ALTER TABLE public.feedback_submissions 
RENAME COLUMN userid TO "userId";

ALTER TABLE public.feedback_submissions 
RENAME COLUMN teamid TO "teamId";

ALTER TABLE public.feedback_submissions 
RENAME COLUMN teamname TO "teamName";

ALTER TABLE public.feedback_submissions 
RENAME COLUMN createdat TO "createdAt";

ALTER TABLE public.feedback_submissions 
RENAME COLUMN updatedat TO "updatedAt";

-- Update indexes to use the new column names
DROP INDEX IF EXISTS idx_feedback_submissions_user_id;
CREATE INDEX idx_feedback_submissions_user_id ON public.feedback_submissions("userId");

DROP INDEX IF EXISTS idx_feedback_submissions_created_at;
CREATE INDEX idx_feedback_submissions_created_at ON public.feedback_submissions("createdAt");
