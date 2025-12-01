-- Simple Fix Script for Both Accounts
-- Copy this script and replace the placeholder values with your actual data
-- Then run it in Supabase SQL Editor

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
-- STEP 2: Fix Account 1
-- ============================================
-- REPLACE THESE VALUES:
-- - 'REPLACE_WITH_ACCOUNT1_CLERK_USER_ID' → Your Clerk User ID (starts with 'user_')
-- - 'REPLACE_WITH_ACCOUNT1_STRIPE_CUSTOMER_ID' → Your Stripe Customer ID (starts with 'cus_')
-- - 'REPLACE_WITH_ACCOUNT1_STRIPE_SUBSCRIPTION_ID' → Your Stripe Subscription ID (starts with 'sub_')
-- - '2025-11-05 13:16:00+00' → Your subscription end date from Stripe

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
  'REPLACE_WITH_ACCOUNT1_CLERK_USER_ID',  -- Replace with Account 1 Clerk User ID
  'REPLACE_WITH_ACCOUNT1_STRIPE_CUSTOMER_ID',  -- Replace with Account 1 Stripe Customer ID
  'REPLACE_WITH_ACCOUNT1_STRIPE_SUBSCRIPTION_ID',  -- Replace with Account 1 Stripe Subscription ID
  (SELECT id FROM subscription_plans WHERE name = 'Pro' LIMIT 1),
  'Pro',
  'active',
  '2025-11-05 13:16:00+00'::timestamp with time zone,  -- Replace with Account 1 subscription end date
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  plan_id = EXCLUDED.plan_id,
  plan_name = 'Pro',
  status = 'active',
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();

-- ============================================
-- STEP 3: Fix Account 2
-- ============================================
-- REPLACE THESE VALUES:
-- - 'REPLACE_WITH_ACCOUNT2_CLERK_USER_ID' → Your Clerk User ID (starts with 'user_')
-- - 'REPLACE_WITH_ACCOUNT2_STRIPE_CUSTOMER_ID' → Your Stripe Customer ID (starts with 'cus_')
-- - 'REPLACE_WITH_ACCOUNT2_STRIPE_SUBSCRIPTION_ID' → Your Stripe Subscription ID (starts with 'sub_')
-- - '2025-11-05 13:16:00+00' → Your subscription end date from Stripe

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
  'REPLACE_WITH_ACCOUNT2_CLERK_USER_ID',  -- Replace with Account 2 Clerk User ID
  'REPLACE_WITH_ACCOUNT2_STRIPE_CUSTOMER_ID',  -- Replace with Account 2 Stripe Customer ID
  'REPLACE_WITH_ACCOUNT2_STRIPE_SUBSCRIPTION_ID',  -- Replace with Account 2 Stripe Subscription ID
  (SELECT id FROM subscription_plans WHERE name = 'Pro' LIMIT 1),
  'Pro',
  'active',
  '2025-11-05 13:16:00+00'::timestamp with time zone,  -- Replace with Account 2 subscription end date
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  stripe_subscription_id = EXCLUDED.stripe_subscription_id,
  plan_id = EXCLUDED.plan_id,
  plan_name = 'Pro',
  status = 'active',
  current_period_end = EXCLUDED.current_period_end,
  updated_at = NOW();

-- ============================================
-- STEP 4: Verify the fixes
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
  'REPLACE_WITH_ACCOUNT1_CLERK_USER_ID',  -- Replace with Account 1 Clerk User ID
  'REPLACE_WITH_ACCOUNT2_CLERK_USER_ID'   -- Replace with Account 2 Clerk User ID
)
ORDER BY updated_at DESC;

