-- Social Media Analysis Tables
CREATE TABLE IF NOT EXISTS social_media_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  handle VARCHAR(255) NOT NULL,
  profile_url TEXT,
  consent_given BOOLEAN DEFAULT false,
  analysis_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES social_media_profiles(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  post_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  post_date TIMESTAMP WITH TIME ZONE,
  engagement_metrics JSONB DEFAULT '{}',
  is_original BOOLEAN DEFAULT true,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, post_id)
);

CREATE TABLE IF NOT EXISTS social_media_style_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL DEFAULT '{}',
  style_profile JSONB NOT NULL DEFAULT '{}',
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  posts_analyzed INTEGER DEFAULT 0,
  last_analysis TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS privacy_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(100) NOT NULL,
  consent_given BOOLEAN DEFAULT false,
  consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  UNIQUE(user_id, consent_type)
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE social_media_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE social_media_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE social_media_style_analysis;
ALTER PUBLICATION supabase_realtime ADD TABLE privacy_consents;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_media_profiles_user_id ON social_media_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_profile_id ON social_media_posts(profile_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_scraped_at ON social_media_posts(scraped_at);
CREATE INDEX IF NOT EXISTS idx_social_media_style_analysis_user_id ON social_media_style_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_consents_user_id ON privacy_consents(user_id);