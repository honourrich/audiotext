-- Enhanced database schema for transcript & content generator platform

-- Create users table to parallel auth.users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create episodes table with enhanced fields
CREATE TABLE IF NOT EXISTS episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  audio_url TEXT,
  youtube_url TEXT,
  file_size BIGINT,
  duration INTEGER, -- in seconds
  
  -- Content fields
  transcript TEXT,
  summary_short TEXT,
  summary_long TEXT,
  chapters JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  quotes JSONB DEFAULT '[]'::jsonb,
  
  -- Processing fields
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'uploading', 'transcribing', 'generating', 'completed', 'error')),
  processing_progress INTEGER DEFAULT 0 CHECK (processing_progress >= 0 AND processing_progress <= 100),
  processing_error TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_edited TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Usage tracking
  word_count INTEGER DEFAULT 0,
  processing_time INTEGER DEFAULT 0, -- in seconds
  api_cost DECIMAL(10,4) DEFAULT 0.00
);

-- Create episode versions table for version control
CREATE TABLE IF NOT EXISTS episode_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  changes_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create processing queue table
CREATE TABLE IF NOT EXISTS processing_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  queue_position INTEGER,
  priority INTEGER DEFAULT 0,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create user usage tracking table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- format: 'YYYY-MM'
  episodes_processed INTEGER DEFAULT 0,
  total_minutes_processed INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  max_episodes_per_month INTEGER,
  max_minutes_per_episode INTEGER,
  priority_processing BOOLEAN DEFAULT FALSE,
  features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price_monthly, price_yearly, max_episodes_per_month, max_minutes_per_episode, priority_processing, features) VALUES
('Free', 0.00, 0.00, 3, 30, FALSE, '{"export_formats": ["txt"], "support": "community"}'),
('Pro', 19.99, 199.99, 50, 180, TRUE, '{"export_formats": ["txt", "pdf", "docx"], "support": "email", "advanced_editing": true}'),
('Enterprise', 49.99, 499.99, -1, -1, TRUE, '{"export_formats": ["txt", "pdf", "docx", "json"], "support": "priority", "advanced_editing": true, "api_access": true}')
ON CONFLICT DO NOTHING;

-- Create user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_episodes_user_id ON episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(processing_status);
CREATE INDEX IF NOT EXISTS idx_episodes_created_at ON episodes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_episode_versions_episode_id ON episode_versions(episode_id);
CREATE INDEX IF NOT EXISTS idx_processing_queue_user_id ON processing_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month_year);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_usage_updated_at BEFORE UPDATE ON user_usage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE episodes;
ALTER PUBLICATION supabase_realtime ADD TABLE episode_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE processing_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE user_usage;
ALTER PUBLICATION supabase_realtime ADD TABLE user_subscriptions;