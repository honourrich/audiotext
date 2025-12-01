# Manual Subscription Sync Guide

If your Stripe subscription isn't syncing to your app (showing as Free plan instead of Pro), you can manually sync it using this guide.

## What You Need

To manually sync your subscription, you'll need these 4 pieces of information:

### 1. Your Clerk User ID
**Where to find it:**
- **Option A (Browser Console):**
  1. Open your app in browser
  2. Press `F12` to open Developer Tools
  3. Go to Console tab
  4. Type: `window.Clerk?.user?.id` and press Enter
  5. Copy the ID (starts with `user_`)

- **Option B (Clerk Dashboard):**
  1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
  2. Navigate to Users
  3. Find your user (by email)
  4. Click on your user
  5. Copy the User ID (starts with `user_`)

**Example:** `user_2abc123def456`

---

### 2. Your Stripe Customer ID
**Where to find it:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Customers**
3. Find your customer (search by email)
4. Click on your customer
5. Copy the **Customer ID** (starts with `cus_`)

**Example:** `cus_ABC123xyz`

---

### 3. Your Stripe Subscription ID
**Where to find it:**
1. In Stripe Dashboard, go to your customer (from step 2)
2. Click on the **Subscriptions** tab
3. Click on your active subscription
4. Copy the **Subscription ID** (starts with `sub_`)

**Example:** `sub_XYZ789abc`

---

### 4. Your Subscription End Date
**Where to find it:**
1. In Stripe Dashboard, go to your subscription (from step 3)
2. Look for **Current period end** or **Billing period end**
3. Copy the date and time

**Example:** `February 15, 2025 at 11:59 PM UTC` → Convert to: `2025-02-15 23:59:59+00`

---

## How to Sync

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Get the Pro Plan ID
Run this query first to get the Pro plan UUID:

```sql
SELECT id, name 
FROM subscription_plans 
WHERE name = 'Pro';
```

Copy the `id` value (it's a UUID like `123e4567-e89b-12d3-a456-426614174000`)

### Step 3: Insert/Update Your Subscription
Replace the placeholders in this query with your actual values:

```sql
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
  'YOUR_CLERK_USER_ID',  -- Replace with your Clerk User ID (e.g., 'user_2abc123def456')
  'YOUR_STRIPE_CUSTOMER_ID',  -- Replace with your Stripe Customer ID (e.g., 'cus_ABC123')
  'YOUR_STRIPE_SUBSCRIPTION_ID',  -- Replace with your Stripe Subscription ID (e.g., 'sub_XYZ789')
  'YOUR_PLAN_ID_HERE'::uuid,  -- Replace with the UUID from Step 2
  'Pro',
  'active',
  '2025-02-15 23:59:59+00'::timestamp with time zone,  -- Replace with your subscription end date
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
```

### Step 4: Verify
Run this query to verify your subscription was created:

```sql
SELECT 
  us.id,
  us.user_id,
  us.stripe_customer_id,
  us.stripe_subscription_id,
  us.plan_name,
  us.status,
  us.current_period_end,
  us.created_at,
  us.updated_at
FROM user_subscriptions us
WHERE us.user_id = 'YOUR_CLERK_USER_ID';  -- Replace with your Clerk User ID
```

You should see a row with:
- `plan_name`: `Pro`
- `status`: `active`
- Your Stripe IDs populated

### Step 5: Check Your App
1. Refresh your app
2. Your plan should now show as **Pro** instead of **Free**
3. Check the Dashboard - the "Upgrade to Plus" button should be gone

---

## Troubleshooting

### Error: "relation 'user_subscriptions' does not exist"
This means the table hasn't been created yet. Run your database migrations first.

### Error: "duplicate key value violates unique constraint"
This means a subscription already exists for this user. The `ON CONFLICT` clause should handle this, but if you still get an error, try updating instead:

```sql
UPDATE user_subscriptions
SET 
  stripe_customer_id = 'YOUR_STRIPE_CUSTOMER_ID',
  stripe_subscription_id = 'YOUR_STRIPE_SUBSCRIPTION_ID',
  plan_id = 'YOUR_PLAN_ID_HERE'::uuid,
  plan_name = 'Pro',
  status = 'active',
  current_period_end = '2025-02-15 23:59:59+00'::timestamp with time zone,
  updated_at = NOW()
WHERE user_id = 'YOUR_CLERK_USER_ID';
```

### Still showing as Free plan?
1. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check the browser console for errors
4. Verify the subscription record exists in the database (Step 4)

---

## Alternative: Use the SQL File

You can also use the `manual-subscription-sync.sql` file in this repository:
1. Open the file
2. Replace all placeholders with your actual values
3. Copy and paste into Supabase SQL Editor
4. Run it

---

## Why Manual Sync?

Manual sync is needed when:
- Webhook events failed (400/500 errors)
- Your email wasn't available when checkout completed
- Webhook wasn't configured when you purchased
- There was a temporary database issue

After manual sync, future webhook events should work normally to keep your subscription in sync.

