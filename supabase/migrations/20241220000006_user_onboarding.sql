-- User Onboarding Tables
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  user_segment VARCHAR(50),
  content_preferences JSONB DEFAULT '{}',
  style_preferences JSONB DEFAULT '{}',
  first_content_data JSONB DEFAULT '{}',
  analytics_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS onboarding_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  data JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(255),
  user_agent TEXT,
  ip_address INET
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_onboarding;
ALTER PUBLICATION supabase_realtime ADD TABLE onboarding_analytics;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(completed);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_user_id ON onboarding_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_step ON onboarding_analytics(step_number);
CREATE INDEX IF NOT EXISTS idx_onboarding_analytics_timestamp ON onboarding_analytics(timestamp);