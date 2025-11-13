-- Add YouTube functionality to AudioText
-- This migration adds support for YouTube caption extraction and content generation

-- Create youtube_episodes table for dedicated YouTube episode storage
CREATE TABLE IF NOT EXISTS youtube_episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  video_title TEXT,
  transcript TEXT,
  generated_content JSONB DEFAULT '{}'::jsonb,
  source_type TEXT DEFAULT 'youtube',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT youtube_episodes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT youtube_episodes_youtube_url_check CHECK (youtube_url ~ '^https?://(www\.)?(youtube\.com|youtu\.be)/')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_youtube_episodes_user_id ON youtube_episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_episodes_created_at ON youtube_episodes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_youtube_episodes_youtube_url ON youtube_episodes(youtube_url);

-- Update existing episodes table to support both audio and YouTube sources
ALTER TABLE episodes 
ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'audio' CHECK (source_type IN ('audio', 'youtube')),
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Create index for source_type filtering
CREATE INDEX IF NOT EXISTS idx_episodes_source_type ON episodes(source_type);

-- Update the youtube_url constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'episodes_youtube_url_check'
    ) THEN
        ALTER TABLE episodes 
        ADD CONSTRAINT episodes_youtube_url_check 
        CHECK (youtube_url IS NULL OR youtube_url ~ '^https?://(www\.)?(youtube\.com|youtu\.be)/');
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for youtube_episodes updated_at
DROP TRIGGER IF EXISTS update_youtube_episodes_updated_at ON youtube_episodes;
CREATE TRIGGER update_youtube_episodes_updated_at
    BEFORE UPDATE ON youtube_episodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for youtube_episodes
ALTER TABLE youtube_episodes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for youtube_episodes
DROP POLICY IF EXISTS "Users can view their own youtube episodes" ON youtube_episodes;
CREATE POLICY "Users can view their own youtube episodes" ON youtube_episodes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own youtube episodes" ON youtube_episodes;
CREATE POLICY "Users can insert their own youtube episodes" ON youtube_episodes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own youtube episodes" ON youtube_episodes;
CREATE POLICY "Users can update their own youtube episodes" ON youtube_episodes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own youtube episodes" ON youtube_episodes;
CREATE POLICY "Users can delete their own youtube episodes" ON youtube_episodes
    FOR DELETE USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON youtube_episodes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
