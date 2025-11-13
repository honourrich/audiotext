-- Reset all users' usage data
-- Run this in your Supabase SQL Editor
-- 
-- WARNING: This will reset ALL usage data for ALL users
-- Use this only for testing/development purposes

-- Option 1: Reset all usage to zero (keeps records, just zeros them out)
-- This is safer as it preserves the table structure and records
UPDATE user_usage 
SET 
  total_minutes_processed = 0,
  gpt_prompts_used = 0,
  episodes_processed = 0,
  api_calls_made = 0,
  total_cost = 0.00,
  updated_at = NOW();

-- Option 2: Delete all usage records completely (uncomment to use)
-- DELETE FROM user_usage;

-- Verify the reset (should show all zeros)
SELECT 
  user_id,
  month_year,
  total_minutes_processed,
  gpt_prompts_used,
  episodes_processed,
  updated_at
FROM user_usage
ORDER BY updated_at DESC
LIMIT 10;

-- Show summary
SELECT 
  COUNT(*) as total_records,
  SUM(total_minutes_processed) as total_minutes,
  SUM(gpt_prompts_used) as total_gpt_prompts
FROM user_usage;

