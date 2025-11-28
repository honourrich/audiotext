# 🔴 Stripe Live Mode Setup Guide

## ⚠️ Important: Switching to Live Mode

This guide will help you switch from Stripe test mode to **live/production mode**. Live mode processes **real payments**, so make sure you're ready!

## 📋 Prerequisites

Before switching to live mode, ensure:
- [ ] Your Stripe account is activated
- [ ] You've tested everything in test mode
- [ ] You have your live API keys from Stripe Dashboard
- [ ] You've created live products/prices in Stripe

## 🔑 Step 1: Get Your Live Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Toggle to Live Mode** (switch in the top right)
3. Go to **Developers** → **API keys**
4. Copy these keys:
   - **Publishable key** (starts with `pk_live_...`)
   - **Secret key** (starts with `sk_live_...`)

## 💰 Step 2: Create Live Products & Prices

If you haven't created live products yet:

1. In Stripe Dashboard (Live Mode), go to **Products**
2. Click **Add Product**
3. Create "Pro Plan":
   - Name: `Pro Plan`
   - Description: `500 mins audio + unlimited YouTube + 50 prompts`
   - Price: `$7/week` (recurring, weekly)
   - Save the **Price ID** (starts with `price_...`)

Or use Stripe CLI:
```bash
# Switch to live mode
stripe --api-key sk_live_YOUR_KEY

# Create product
stripe products create --name="Pro Plan" --description="500 mins audio + unlimited YouTube + 50 prompts"

# Create price (replace prod_XXXXX with your product ID)
stripe prices create \
  --product=prod_XXXXX \
  --unit-amount=700 \
  --currency=usd \
  --recurring[interval]=week
```

**Save the Price ID** - you'll need it for Supabase secrets.

## 🌐 Step 3: Update Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_STRIPE_PUBLISHABLE_KEY`
5. **Update** it with your **live** publishable key (`pk_live_...`)
6. Make sure it's set for **Production** environment
7. **Redeploy** your application

## 🔐 Step 4: Update Supabase Secrets

Update these secrets in Supabase (use live keys):

```bash
# Update Stripe secret key (LIVE)
supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY

# Update Stripe Price ID (LIVE)
supabase secrets set STRIPE_PRO_PRICE_ID=price_YOUR_LIVE_PRICE_ID

# Optional: If using Product ID instead
supabase secrets set STRIPE_PRO_PRODUCT_ID=prod_YOUR_LIVE_PRODUCT_ID
```

Or via Supabase Dashboard:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Update each secret:
   - `STRIPE_SECRET_KEY` → `sk_live_...` (your live secret key)
   - `STRIPE_PRO_PRICE_ID` → `price_...` (your live price ID)
   - `STRIPE_PRO_PRODUCT_ID` → `prod_...` (optional, if using product ID)

## 🔔 Step 5: Set Up Live Webhook

1. In Stripe Dashboard (Live Mode), go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to:
   ```
   https://your-project-id.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_...`)
6. Add to Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET
   ```

## ✅ Step 6: Verify Configuration

### Check Vercel Environment Variables:
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (not `pk_test_...`)

### Check Supabase Secrets:
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` (not `sk_test_...`)
- [ ] `STRIPE_PRO_PRICE_ID` = `price_...` (live price ID)
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` (live webhook secret)

### Test the Flow:
1. Go to your deployed app
2. Click "Upgrade to Plus"
3. You should see **live Stripe checkout** (not test mode)
4. Use a **real credit card** (or Stripe test card in live mode won't work)
5. Complete the checkout
6. Verify subscription appears in Stripe Dashboard (Live Mode)

## 🚨 Important Notes

### ⚠️ Live Mode = Real Money
- **Live mode processes real payments**
- **Test cards won't work** in live mode
- **Charges are real** - make sure you're ready!

### 🔒 Security
- Never commit live keys to git
- Keep live keys secure
- Rotate keys if compromised

### 🧪 Testing
- Test thoroughly in **test mode** first
- Only switch to live when ready
- Monitor Stripe Dashboard for issues

## 🔄 Rollback Plan

If you need to switch back to test mode:

1. **Vercel**: Change `VITE_STRIPE_PUBLISHABLE_KEY` back to `pk_test_...`
2. **Supabase**: Change `STRIPE_SECRET_KEY` back to `sk_test_...`
3. **Supabase**: Change `STRIPE_PRO_PRICE_ID` back to test price ID
4. **Redeploy** application

## 📊 Monitoring

After going live, monitor:
- Stripe Dashboard → Payments (for successful charges)
- Stripe Dashboard → Webhooks (for delivery status)
- Supabase Edge Function logs (for errors)
- Your application logs (for checkout issues)

## 🆘 Troubleshooting

### "Invalid API key"
- Check that you're using live keys in live mode
- Verify keys are copied correctly (no extra spaces)

### "Price not found"
- Verify `STRIPE_PRO_PRICE_ID` is set correctly
- Check that the price exists in Stripe Dashboard (Live Mode)
- Ensure price is active

### "Webhook not working"
- Verify webhook endpoint URL is correct
- Check webhook secret matches
- Ensure webhook is enabled in Stripe Dashboard

---

**Ready to go live?** Follow the steps above, and you'll be processing real payments! 💳

