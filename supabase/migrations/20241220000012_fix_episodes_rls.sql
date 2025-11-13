-- Fix episodes table RLS to allow dashboard access
-- This migration ensures the episodes table has proper RLS policies

-- First, enable RLS on episodes table if it exists
ALTER TABLE IF EXISTS public.episodes ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for episodes table
-- Users can only access their own episodes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'episodes' AND table_schema = 'public') THEN
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
    END IF;
END $$;
