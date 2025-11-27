# Welcome Email Function

This Supabase Edge Function sends automated welcome emails to new users when they sign up via Clerk.

## Setup

### 1. Environment Variables

Make sure you have these secrets set in Supabase:

```bash
# Your Resend API key
RESEND_API_KEY=re_xxxxx

# Optional: Custom from email (defaults to welcome@audiotext.app)
RESEND_FROM_EMAIL=welcome@audiotext.app
```

To set secrets:
```bash
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set RESEND_FROM_EMAIL=welcome@audiotext.app
```

### 2. Deploy the Function

```bash
supabase functions deploy send-welcome-email --no-verify-jwt
```

The `--no-verify-jwt` flag is needed because this function receives webhooks from Clerk, not authenticated requests from your frontend.

### 3. Configure Clerk Webhook

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Webhooks
2. Click "Add Endpoint"
3. Set the endpoint URL to:
   ```
   https://your-project-id.supabase.co/functions/v1/send-welcome-email
   ```
4. Subscribe to event: `user.created`
5. Copy the signing secret (optional but recommended for security)

### 4. Test the Function

You can test locally using the Supabase CLI:

```bash
supabase functions serve send-welcome-email
```

Then send a test webhook:

```bash
curl -X POST http://localhost:54321/functions/v1/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user.created",
    "data": {
      "id": "user_test123",
      "email_addresses": [{"email_address": "test@example.com"}],
      "first_name": "Test"
    }
  }'
```

## How It Works

1. Clerk sends a `user.created` webhook when a new user signs up
2. This function receives the webhook
3. Extracts user email and name from the payload
4. Sends a beautiful welcome email via Resend API
5. Returns success/error response

## Email Template

The email includes:
- Branded header with gradient (matching audiotext.app logo)
- Personalized greeting
- Feature highlights
- Call-to-action button
- Quick tip section
- Professional footer

## Troubleshooting

- **Email not sending**: Check that `RESEND_API_KEY` is set correctly in Supabase secrets
- **Webhook not received**: Verify the endpoint URL in Clerk dashboard matches your Supabase function URL
- **Check logs**: View function logs in Supabase Dashboard → Edge Functions → send-welcome-email → Logs

