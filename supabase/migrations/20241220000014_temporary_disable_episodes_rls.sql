-- Temporary fix: Disable RLS on episodes table to restore dashboard access
-- This is a temporary measure - run the proper migration after this

-- Disable RLS on episodes table temporarily
ALTER TABLE IF EXISTS public.episodes DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view own episodes" ON public.episodes;
DROP POLICY IF EXISTS "Users can insert own episodes" ON public.episodes;
DROP POLICY IF EXISTS "Users can update own episodes" ON public.episodes;
DROP POLICY IF EXISTS "Users can delete own episodes" ON public.episodes;
