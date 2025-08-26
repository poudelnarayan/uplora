-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  personal_team_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  youtube_access_token TEXT,
  youtube_refresh_token TEXT,
  youtube_expires_at TIMESTAMP WITH TIME ZONE,
  youtube_channel_id TEXT,
  youtube_channel_title TEXT
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_personal BOOLEAN DEFAULT FALSE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT CHECK (role IN ('ADMIN', 'MANAGER', 'EDITOR')) DEFAULT 'EDITOR',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('ACTIVE', 'PAUSED')) DEFAULT 'ACTIVE',
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE(user_id, team_id)
);

-- Create team_invites table
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('ADMIN', 'MANAGER', 'EDITOR')) DEFAULT 'EDITOR',
  status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')) DEFAULT 'PENDING',
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(email, team_id)
);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('PROCESSING', 'PENDING', 'PUBLISHED')) DEFAULT 'PROCESSING',
  requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  description TEXT,
  visibility TEXT,
  made_for_kids BOOLEAN DEFAULT FALSE,
  thumbnail_key TEXT
);

-- Create upload_locks table
CREATE TABLE IF NOT EXISTS upload_locks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL,
  metadata TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_is_personal ON teams(is_personal);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_invites_team_id ON team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_team_id ON videos(team_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_uploaded_at ON videos(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_upload_locks_user_id ON upload_locks(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_invites_updated_at BEFORE UPDATE ON team_invites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_upload_locks_updated_at BEFORE UPDATE ON upload_locks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_locks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = clerk_id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = clerk_id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid()::text = clerk_id);

-- Teams policies
CREATE POLICY "Users can view teams they own or are members of" ON teams FOR SELECT USING (
  owner_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
  id IN (SELECT team_id FROM team_members WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text))
);
CREATE POLICY "Users can update teams they own" ON teams FOR UPDATE USING (
  owner_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "Users can insert teams" ON teams FOR INSERT WITH CHECK (
  owner_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);

-- Team members policies
CREATE POLICY "Users can view team members of teams they have access to" ON team_members FOR SELECT USING (
  team_id IN (
    SELECT id FROM teams WHERE 
      owner_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
      id IN (SELECT team_id FROM team_members WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text))
  )
);
CREATE POLICY "Team owners can manage team members" ON team_members FOR ALL USING (
  team_id IN (SELECT id FROM teams WHERE owner_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text))
);

-- Videos policies
CREATE POLICY "Users can view videos they own or have team access to" ON videos FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
  team_id IN (
    SELECT id FROM teams WHERE 
      owner_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text) OR
      id IN (SELECT team_id FROM team_members WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text))
  )
);
CREATE POLICY "Users can insert videos" ON videos FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "Users can update videos they own" ON videos FOR UPDATE USING (
  user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "Users can delete videos they own" ON videos FOR DELETE USING (
  user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);

-- Upload locks policies
CREATE POLICY "Users can view own upload locks" ON upload_locks FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);
CREATE POLICY "Users can manage own upload locks" ON upload_locks FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE clerk_id = auth.uid()::text)
);
