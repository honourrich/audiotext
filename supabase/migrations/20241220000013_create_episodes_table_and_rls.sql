-- Create episodes table if it doesn't exist and fix RLS
-- This migration ensures the episodes table exists with proper structure and RLS

-- First, create the episodes table if it doesn't exist
CREATE TABLE IF NOT EXISTS episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
  api_cost DECIMAL(10,4) DEFAULT 0.00,
  
  -- Collaboration fields
  workspace_id UUID,
  current_status TEXT DEFAULT 'draft' CHECK (current_status IN ('draft', 'in_review', 'needs_changes', 'approved', 'published')),
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMP WITH TIME ZONE
);

-- Add user_id column if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'user_id' AND table_schema = 'public') THEN
        ALTER TABLE episodes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS on episodes table
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for episodes table
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view own episodes" ON public.episodes;
    DROP POLICY IF EXISTS "Users can insert own episodes" ON public.episodes;
    DROP POLICY IF EXISTS "Users can update own episodes" ON public.episodes;
    DROP POLICY IF EXISTS "Users can delete own episodes" ON public.episodes;
    
    -- Create new policies
    CREATE POLICY "Users can view own episodes" ON public.episodes
        FOR SELECT USING (auth.uid() = user_id);
        
    CREATE POLICY "Users can insert own episodes" ON public.episodes
        FOR INSERT WITH CHECK (auth.uid() = user_id);
        
    CREATE POLICY "Users can update own episodes" ON public.episodes
        FOR UPDATE USING (auth.uid() = user_id);
        
    CREATE POLICY "Users can delete own episodes" ON public.episodes
        FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_episodes_user_id ON episodes(user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_created_at ON episodes(created_at);
CREATE INDEX IF NOT EXISTS idx_episodes_processing_status ON episodes(processing_status);
