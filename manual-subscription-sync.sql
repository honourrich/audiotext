-- Manual Subscription Sync Script
-- Use this to manually sync a Stripe subscription to your database
-- 
-- REQUIRED INFORMATION (get these from Stripe Dashboard):
-- 1. Your Stripe Customer ID (from Stripe Dashboard → Customers → your customer) - starts with 'cus_'
-- 2. Your Stripe Subscription ID (from Stripe Dashboard → Customers → your customer → Subscriptions) - starts with 'sub_'
-- 3. Your subscription end date (from Stripe Dashboard → Subscriptions → your subscription → Current period end)
-- 4. Your Clerk User ID (from your app console: user.id) - starts with 'user_'
-- 5. Your email address (the one you used in Stripe checkout)
--
-- INSTRUCTIONS:
-- 1. Get your Clerk User ID:
--    - Open your app in browser
--    - Open browser console (F12)
--    - Type: window.Clerk?.user?.id (or check localStorage/React DevTools)
--    - OR: Check your Clerk Dashboard → Users → find your user → copy the User ID
--
-- 2. Get Stripe information:
--    - Go to Stripe Dashboard → Customers
--    - Find your customer (by email)
--    - Copy Customer ID (cus_...)
--    - Click on Subscriptions tab
--    - Copy Subscription ID (sub_...)
--    - Copy Current period end date
--
-- 3. Replace placeholders below with your actual values
-- 4. Run this in Supabase SQL Editor
-- 5. Check your app - your Pro plan should appear

-- Step 1: Check if we need to add missing columns
-- The webhook code expects stripe_customer_id and plan_name columns
-- Run this first to add them if they don't exist:
DO $$
BEGIN
  -- Add stripe_customer_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN stripe_customer_id TEXT;
    RAISE NOTICE 'Added stripe_customer_id column';
  END IF;

  -- Add plan_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' AND column_name = 'plan_name'
  ) THEN
    ALTER TABLE user_subscriptions ADD COLUMN plan_name TEXT;
    RAISE NOTICE 'Added plan_name column';
  END IF;

  -- Add unique constraint on user_id if it doesn't exist (for ON CONFLICT)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_subscriptions_user_id_key'
  ) THEN
    ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint on user_id';
  END IF;
END $$;

-- Step 2: Get the Pro plan ID
SELECT id, name 
FROM subscription_plans 
WHERE name = 'Pro';

-- Step 3: Insert/Update your subscription
-- Replace these values with your actual data:
--   - 'user_35uOvpYdriZUsoygkhK9Z0gDciJ' - Your Clerk User ID
--   - 'cus_TVGpxGwNlkMJ49' - Your Stripe Customer ID
--   - 'sub_1SYGI02KGFpgmzWcvbTwMu9e' - Your Stripe Subscription ID
--   - 'YOUR_PLAN_ID_HERE' - The UUID from Step 2 (Pro plan)
--   - '2025-11-05 13:16:00+00' - Your subscription end date

INSERT INTO user_subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  plan_id,
  plan_name,
  status,
  current_period_end,
  created_at,
  updated_at
)
VALUES (
  'user_35uOvpYdriZUsoygkhK9Z0gDciJ',  -- Your Clerk User ID
  'cus_TVGpxGwNlkMJ49',  -- Your Stripe Customer ID
  'sub_1SYGI02KGFpgmzWcvbTwMu9e',  -- Your Stripe Subscription ID
  (SELECT id FROM subscription_plans WHERE name = 'Pro' LIMIT 1),  -- Pro plan UUID
  'Pro',
  'active',
  '2025-11-05 13:16:00+00'::timestamp with time zone,  -- Your subscription end date
  NOW(),
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  plan_id = EXCLUDED.plan_id,
  plan_name = EXCLUDED.plan_name,
  status = EXCLUDED.status,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();

-- Step 4: Verify the subscription was created
SELECT 
  us.id,
  us.user_id,
  us.stripe_customer_id,
  us.stripe_subscription_id,
  us.plan_id,
  us.plan_name,
  sp.name as plan_name_from_table,
  us.status,
  us.current_period_end,
  us.created_at,
  us.updated_at
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = 'user_35uOvpYdriZUsoygkhK9Z0gDciJ';  -- Your Clerk User ID

-- Alternative: If you have a users table with email, you can verify by email:
-- SELECT 
--   us.id,
--   us.user_id,
--   u.email,
--   us.stripe_customer_id,
--   us.stripe_subscription_id,
--   us.plan_name,
--   us.status,
--   us.current_period_end
-- FROM user_subscriptions us
-- LEFT JOIN users u ON us.user_id = u.id OR us.user_id = u.clerk_id
-- WHERE u.email = 'your-email@example.com';  -- Replace with your email

