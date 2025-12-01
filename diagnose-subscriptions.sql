-- Diagnostic Script for Subscription Issues
-- This script will help identify and fix subscription problems

-- Step 1: Check all subscriptions in the database
SELECT 
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  plan_name,
  plan_id,
  status,
  current_period_end,
  created_at,
  updated_at
FROM user_subscriptions
ORDER BY updated_at DESC;

-- Step 2: Check subscription plans
SELECT id, name, max_minutes_per_episode, features
FROM subscription_plans;

-- Step 3: Check if subscriptions have valid plan_id references
SELECT 
  us.user_id,
  us.plan_name,
  us.plan_id,
  sp.name as plan_name_from_join,
  us.status
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
ORDER BY us.updated_at DESC;

-- Step 4: Find subscriptions that might be missing plan_id
SELECT 
  user_id,
  stripe_customer_id,
  plan_name,
  plan_id,
  status,
  CASE 
    WHEN plan_id IS NULL THEN 'MISSING plan_id'
    WHEN status != 'active' THEN 'WRONG status: ' || status
    ELSE 'OK'
  END as issue
FROM user_subscriptions
WHERE plan_id IS NULL OR status != 'active'
ORDER BY updated_at DESC;

