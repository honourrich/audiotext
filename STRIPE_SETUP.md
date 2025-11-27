# Stripe Integration Setup Guide

## Overview

This application integrates Stripe for subscription payments. The integration includes:
- Stripe Checkout for new subscriptions
- Stripe Customer Portal for subscription management
- Webhook handlers for subscription events

## Prerequisites

1. A Stripe account (create one at [stripe.com](https://stripe.com))
2. Supabase project with Edge Functions enabled
3. Clerk authentication configured

## Setup Steps

### 1. Create Stripe Products and Prices

In your Stripe Dashboard:

1. Go to **Products** → **Add Product**
2. Create a product named "Pro Plan"
3. Set the price to **$7/week** (recurring, weekly interval)
4. Save the **Price ID** (starts with `price_...`)

Alternatively, use Stripe CLI:

```bash
stripe products create --name="Pro Plan" --description="500 mins audio + unlimited YouTube + 50 prompts"

stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=700 \
  --currency=usd \
  --recurring[interval]=week \
  --lookup-key=pro
```

### 2. Configure Stripe Customer Portal

1. Go to **Settings** → **Billing** → **Customer portal**
2. Enable the customer portal
3. Configure which features customers can manage:
   - ✅ Cancel subscriptions
   - ✅ Update payment methods
   - ✅ View invoices
   - ✅ Update billing information

### 3. Set Up Environment Variables

#### Frontend Environment Variables

Add to your `.env` file or environment configuration:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://your-project.supabase.co
```

#### Supabase Edge Functions Environment Variables

Set these in your Supabase Dashboard under **Project Settings** → **Edge Functions** → **Secrets**:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
CLERK_SECRET_KEY=sk_test_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: 
- Use test keys (`sk_test_`, `pk_test_`) for development
- Use live keys (`sk_live_`, `pk_live_`) for production
- Never commit secret keys to version control

### 4. Configure Stripe Webhooks

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set the endpoint URL to:
   ```
   https://your-project.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_...`) and add it to your Supabase Edge Functions secrets

### 5. Deploy Supabase Edge Functions

Deploy the Stripe functions to Supabase:

```bash
# Deploy checkout function
supabase functions deploy stripe-checkout

# Deploy webhook function
supabase functions deploy stripe-webhook

# Deploy customer portal function
supabase functions deploy stripe-customer-portal
```

Or using the Supabase CLI:

```bash
supabase functions deploy stripe-checkout --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy stripe-customer-portal
```

**Note**: The webhook function should be deployed with `--no-verify-jwt` flag since it receives requests from Stripe, not from your frontend.

### 6. Database Schema

Ensure your database has the `user_subscriptions` table. If not, run this migration:

```sql
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_name TEXT NOT NULL DEFAULT 'Free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);
```

## Testing

### Test Mode

1. Use Stripe test mode keys
2. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date and any CVC

### Test Webhooks Locally

Use Stripe CLI to forward webhooks to your local function:

```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

## Production Checklist

- [ ] Replace test keys with live keys
- [ ] Update webhook endpoint URL to production domain
- [ ] Configure production domain in Stripe Dashboard
- [ ] Test checkout flow end-to-end
- [ ] Test subscription cancellation
- [ ] Test payment failure handling
- [ ] Monitor webhook delivery in Stripe Dashboard
- [ ] Set up error monitoring for failed webhooks

## Troubleshooting

### Checkout not redirecting

- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
- Check browser console for errors
- Verify Edge Function is deployed and accessible

### Webhooks not working

- Verify webhook secret is correct
- Check Stripe Dashboard → Webhooks for delivery logs
- Check Edge Function logs in Supabase Dashboard
- Ensure webhook endpoint URL is correct

### Subscription not updating in database

- Check webhook logs in Stripe Dashboard
- Verify database connection in Edge Function
- Check user_subscriptions table structure
- Ensure user email matches Stripe customer email

## Support

For issues or questions:
1. Check Stripe Dashboard for error logs
2. Check Supabase Edge Function logs
3. Review webhook delivery history in Stripe
4. Contact support with relevant error messages and logs

