-- Enhanced database schema updates for existing structure

-- Add new fields to existing episodes table
ALTER TABLE episodes 
ADD COLUMN IF NOT EXISTS summary_short TEXT,
ADD COLUMN IF NOT EXISTS summary_long TEXT,
ADD COLUMN IF NOT EXISTS chapters JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS quotes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS last_edited TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS processing_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS api_cost DECIMAL(10,4) DEFAULT 0.00;

-- Create episode versions table for version control
CREATE TABLE IF NOT EXISTS episode_versions (
  id SERIAL PRIMARY KEY,
  episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL,
  changes_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

-- Create processing queue table
CREATE TABLE IF NOT EXISTS processing_queue (
  id SERIAL PRIMARY KEY,
  episode_id INTEGER REFERENCES episodes(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  queue_position INTEGER,
  priority INTEGER DEFAULT 0,
  estimated_completion TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Create user usage tracking table (enhanced)
CREATE TABLE IF NOT EXISTS user_usage_monthly (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- format: 'YYYY-MM'
  episodes_processed INTEGER DEFAULT 0,
  total_minutes_processed INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, month_year)
);

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_episodes_last_edited ON episodes(last_edited DESC);
CREATE INDEX IF NOT EXISTS idx_episode_versions_episode_id ON episode_versions(episode_id);
CREATE INDEX IF NOT EXISTS idx_processing_queue_user_id ON processing_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_monthly_user_month ON user_usage_monthly(user_id, month_year);

-- Update existing episodes with sample enhanced data
UPDATE episodes SET 
  summary_short = 'Brief summary of ' || title,
  summary_long = 'Detailed summary and analysis of ' || title || '. This episode covers key insights and actionable takeaways.',
  chapters = '[
    {"title": "Introduction", "start_time": 0, "end_time": 300, "summary": "Opening remarks and topic introduction"},
    {"title": "Main Discussion", "start_time": 300, "end_time": 1200, "summary": "Core content and key points"},
    {"title": "Conclusion", "start_time": 1200, "end_time": 1500, "summary": "Wrap-up and final thoughts"}
  ]'::jsonb,
  keywords = '["podcast", "content", "AI", "transcription", "automation"]'::jsonb,
  quotes = '[
    {"text": "The future of content creation is automated and intelligent.", "timestamp": 450, "speaker": "Host"},
    {"text": "AI tools are revolutionizing how we process and understand audio content.", "timestamp": 890, "speaker": "Guest"}
  ]'::jsonb,
  word_count = COALESCE(duration * 2, 0), -- Rough estimate: 2 words per second
  last_edited = CURRENT_TIMESTAMP
WHERE status = 'completed';