CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host', 'editor', 'marketer', 'va')),
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

CREATE TABLE IF NOT EXISTS episode_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host', 'editor', 'marketer', 'va')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(episode_id, user_id)
);

CREATE TABLE IF NOT EXISTS version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  content_snapshot JSONB NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  change_description TEXT,
  version_number INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS episode_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES episode_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  text_selection JSONB,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'archived')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS episode_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES episode_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS workflow_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'needs_changes', 'approved', 'published')),
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  cursor_position JSONB,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, episode_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_workspace ON team_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_episode_collaborators_episode ON episode_collaborators(episode_id);
CREATE INDEX IF NOT EXISTS idx_version_history_episode ON version_history(episode_id);
CREATE INDEX IF NOT EXISTS idx_episode_comments_episode ON episode_comments(episode_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_episode ON workflow_states(episode_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_episode ON user_presence(episode_id);

ALTER TABLE episodes ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS current_status TEXT DEFAULT 'draft' CHECK (current_status IN ('draft', 'in_review', 'needs_changes', 'approved', 'published'));
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE episodes ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

alter publication supabase_realtime add table workspaces;
alter publication supabase_realtime add table team_members;
alter publication supabase_realtime add table episode_collaborators;
alter publication supabase_realtime add table version_history;
alter publication supabase_realtime add table episode_comments;
alter publication supabase_realtime add table episode_reactions;
alter publication supabase_realtime add table workflow_states;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table user_presence;