-- Fix Script for Both Accounts
-- This script will fix subscriptions for both accounts
-- 
-- BEFORE RUNNING:
-- 1. Get Clerk User IDs for both accounts (from browser console: window.Clerk?.user?.id)
-- 2. Get Stripe Customer IDs for both accounts (from Stripe Dashboard)
-- 3. Get Stripe Subscription IDs for both accounts
-- 4. Replace the placeholders below with actual values
--
-- TO GET CLERK USER ID:
-- - Open app in browser, press F12, go to Console
-- - Type: window.Clerk?.user?.id
-- - OR check Clerk Dashboard → Users → find user → copy User ID
--
-- TO GET STRIPE INFO:
-- - Go to Stripe Dashboard → Customers
-- - Find customer by email
-- - Copy Customer ID (cus_...)
-- - Click Subscriptions tab → Copy Subscription ID (sub_...)
-- - Copy Current period end date

-- ============================================
-- ACCOUNT 1 - REPLACE THESE VALUES:
-- ============================================
-- Account 1 Clerk User ID (starts with 'user_'):
\set account1_clerk_id 'REPLACE_WITH_ACCOUNT1_CLERK_USER_ID'

-- Account 1 Stripe Customer ID (starts with 'cus_'):
\set account1_stripe_customer 'REPLACE_WITH_ACCOUNT1_STRIPE_CUSTOMER_ID'

-- Account 1 Stripe Subscription ID (starts with 'sub_'):
\set account1_stripe_subscription 'REPLACE_WITH_ACCOUNT1_STRIPE_SUBSCRIPTION_ID'

-- Account 1 Subscription End Date (format: 'YYYY-MM-DD HH:MM:SS+00'):
\set account1_period_end 'REPLACE_WITH_ACCOUNT1_SUBSCRIPTION_END_DATE'

-- ============================================
-- ACCOUNT 2 - REPLACE THESE VALUES:
-- ============================================
-- Account 2 Clerk User ID (starts with 'user_'):
\set account2_clerk_id 'REPLACE_WITH_ACCOUNT2_CLERK_USER_ID'

-- Account 2 Stripe Customer ID (starts with 'cus_'):
\set account2_stripe_customer 'REPLACE_WITH_ACCOUNT2_STRIPE_CUSTOMER_ID'

-- Account 2 Stripe Subscription ID (starts with 'sub_'):
\set account2_stripe_subscription 'REPLACE_WITH_ACCOUNT2_STRIPE_SUBSCRIPTION_ID'

-- Account 2 Subscription End Date (format: 'YYYY-MM-DD HH:MM:SS+00'):
\set account2_period_end 'REPLACE_WITH_ACCOUNT2_SUBSCRIPTION_END_DATE'

-- ============================================
-- STEP 1: Ensure columns exist
-- ============================================
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

  -- Add unique constraint on user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_subscriptions_user_id_key'
  ) THEN
    ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint on user_id';
  END IF;
END $$;

-- ============================================
-- STEP 2: Get Pro plan ID
-- ============================================
DO $$
DECLARE
  pro_plan_id UUID;
BEGIN
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE name = 'Pro' LIMIT 1;
  
  IF pro_plan_id IS NULL THEN
    RAISE EXCEPTION 'Pro plan not found in subscription_plans table';
  END IF;
  
  RAISE NOTICE 'Pro plan ID: %', pro_plan_id;
END $$;

-- ============================================
-- STEP 3: Fix Account 1
-- ============================================
-- Note: Replace the placeholders above with actual values, then uncomment and run:

/*
INSERT INTO user_subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  plan_id,
  plan_name,
  status,
  current_period_end,
  updated_at
)
VALUES (
  :'account1_clerk_id',
  :'account1_stripe_customer',
  :'account1_stripe_subscription',
  (SELECT id FROM subscription_plans WHERE name = 'Pro' LIMIT 1),
  'Pro',
  'active',
  :'account1_period_end'::timestamp with time zone,
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  plan_id = EXCLUDED.plan_id,
  plan_name = EXCLUDED.plan_name,
  status = 'active',
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();
*/

-- ============================================
-- STEP 4: Fix Account 2
-- ============================================
-- Note: Replace the placeholders above with actual values, then uncomment and run:

/*
INSERT INTO user_subscriptions (
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  plan_id,
  plan_name,
  status,
  current_period_end,
  updated_at
)
VALUES (
  :'account2_clerk_id',
  :'account2_stripe_customer',
  :'account2_stripe_subscription',
  (SELECT id FROM subscription_plans WHERE name = 'Pro' LIMIT 1),
  'Pro',
  'active',
  :'account2_period_end'::timestamp with time zone,
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  plan_id = EXCLUDED.plan_id,
  plan_name = EXCLUDED.plan_name,
  status = 'active',
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();
*/

-- ============================================
-- STEP 5: Verify the fixes
-- ============================================
SELECT 
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  plan_name,
  status,
  current_period_end,
  updated_at
FROM user_subscriptions
WHERE user_id IN (
  :'account1_clerk_id',
  :'account2_clerk_id'
)
ORDER BY updated_at DESC;

