CREATE TABLE IF NOT EXISTS user_personality_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  openness DECIMAL(3,2) DEFAULT 0.5,
  conscientiousness DECIMAL(3,2) DEFAULT 0.5,
  extraversion DECIMAL(3,2) DEFAULT 0.5,
  agreeableness DECIMAL(3,2) DEFAULT 0.5,
  neuroticism DECIMAL(3,2) DEFAULT 0.5,
  avg_sentence_length INTEGER DEFAULT 15,
  vocabulary_complexity DECIMAL(3,2) DEFAULT 0.5,
  formality_score DECIMAL(3,2) DEFAULT 0.5,
  enthusiasm_score DECIMAL(3,2) DEFAULT 0.5,
  technical_depth DECIMAL(3,2) DEFAULT 0.5,
  writing_patterns JSONB DEFAULT '{}',
  analyzed_episodes INTEGER DEFAULT 0,
  last_analysis_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  brand_name TEXT,
  formality_score DECIMAL(3,2) DEFAULT 0.5,
  technical_level DECIMAL(3,2) DEFAULT 0.5,
  enthusiasm_score DECIMAL(3,2) DEFAULT 0.5,
  authenticity_score DECIMAL(3,2) DEFAULT 0.5,
  liwc_analysis JSONB DEFAULT '{}',
  brand_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  tone_markers JSONB DEFAULT '{}',
  source_content_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_analysis_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS genre_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  genre_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  structure_template JSONB NOT NULL,
  tone_guidelines JSONB DEFAULT '{}',
  required_sections TEXT[] DEFAULT ARRAY[]::TEXT[],
  optional_sections TEXT[] DEFAULT ARRAY[]::TEXT[],
  formatting_rules JSONB DEFAULT '{}',
  example_content TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resource_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  canonical_url TEXT,
  alternative_names TEXT[] DEFAULT ARRAY[]::TEXT[],
  category TEXT,
  description TEXT,
  auto_link_enabled BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personalization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  enable_style_cloning BOOLEAN DEFAULT true,
  enable_brand_voice BOOLEAN DEFAULT true,
  enable_genre_detection BOOLEAN DEFAULT true,
  enable_personality_scoring BOOLEAN DEFAULT true,
  enable_resource_linking BOOLEAN DEFAULT true,
  preferred_genre TEXT,
  manual_overrides JSONB DEFAULT '{}',
  feedback_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS episode_personalization_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  detected_genre TEXT,
  personality_fit_score DECIMAL(3,2),
  brand_voice_score DECIMAL(3,2),
  extracted_resources JSONB DEFAULT '{}',
  personalization_applied JSONB DEFAULT '{}',
  user_feedback JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO genre_templates (genre_name, display_name, description, structure_template, tone_guidelines, required_sections, optional_sections) VALUES
('business', 'Business & Entrepreneurship', 'Professional business content with actionable insights', 
 '{"intro": "Executive Summary", "main": "Key Takeaways", "action": "Action Items", "metrics": "Key Metrics", "resources": "Resources"}',
 '{"formality": 0.8, "technical": 0.7, "enthusiasm": 0.6}',
 ARRAY['Key Takeaways', 'Action Items'],
 ARRAY['Key Metrics', 'Resources', 'Tools Mentioned']),

('comedy', 'Comedy & Entertainment', 'Light-hearted content focusing on entertainment value',
 '{"intro": "Episode Highlights", "moments": "Best Moments", "jokes": "Running Jokes", "quotes": "Memorable Quotes"}',
 '{"formality": 0.3, "technical": 0.2, "enthusiasm": 0.9}',
 ARRAY['Episode Highlights', 'Best Moments'],
 ARRAY['Running Jokes', 'Memorable Quotes', 'Funny Timestamps']),

('education', 'Educational & Learning', 'Structured educational content with clear learning outcomes',
 '{"objectives": "Learning Objectives", "concepts": "Key Concepts", "examples": "Examples", "resources": "Additional Resources", "summary": "Summary"}',
 '{"formality": 0.7, "technical": 0.8, "enthusiasm": 0.7}',
 ARRAY['Learning Objectives', 'Key Concepts'],
 ARRAY['Examples', 'Additional Resources', 'Practice Exercises']),

('interview', 'Interview & Conversation', 'Guest-focused content highlighting key insights and quotes',
 '{"guest": "Guest Introduction", "highlights": "Key Insights", "quotes": "Notable Quotes", "background": "Guest Background"}',
 '{"formality": 0.6, "technical": 0.5, "enthusiasm": 0.7}',
 ARRAY['Guest Introduction', 'Key Insights'],
 ARRAY['Notable Quotes', 'Guest Background', 'Contact Information']),

('storytelling', 'Storytelling & Narrative', 'Narrative-driven content with story structure and themes',
 '{"setup": "Story Setup", "conflict": "Key Conflicts", "resolution": "Resolution", "themes": "Themes", "takeaways": "Takeaways"}',
 '{"formality": 0.5, "technical": 0.3, "enthusiasm": 0.8}',
 ARRAY['Story Setup', 'Key Conflicts'],
 ARRAY['Resolution', 'Themes', 'Character Analysis']);

INSERT INTO resource_database (resource_name, resource_type, canonical_url, alternative_names, category) VALUES
('ChatGPT', 'tool', 'https://chat.openai.com', ARRAY['Chat GPT', 'OpenAI ChatGPT', 'GPT'], 'AI Tools'),
('Notion', 'tool', 'https://notion.so', ARRAY['Notion.so'], 'Productivity'),
('Slack', 'tool', 'https://slack.com', ARRAY[]::TEXT[], 'Communication'),
('Zoom', 'tool', 'https://zoom.us', ARRAY['Zoom.us'], 'Communication'),
('Atomic Habits', 'book', 'https://jamesclear.com/atomic-habits', ARRAY['Atomic Habits by James Clear'], 'Books'),
('The Lean Startup', 'book', 'https://theleanstartup.com', ARRAY['Lean Startup'], 'Books'),
('Y Combinator', 'organization', 'https://ycombinator.com', ARRAY['YC', 'Y-Combinator'], 'Organizations'),
('TechCrunch', 'website', 'https://techcrunch.com', ARRAY['Tech Crunch'], 'News'),
('Product Hunt', 'website', 'https://producthunt.com', ARRAY['Product Hunt'], 'Tools');

alter publication supabase_realtime add table user_personality_profiles;
alter publication supabase_realtime add table brand_voice_profiles;
alter publication supabase_realtime add table genre_templates;
alter publication supabase_realtime add table resource_database;
alter publication supabase_realtime add table personalization_settings;
alter publication supabase_realtime add table episode_personalization_data;