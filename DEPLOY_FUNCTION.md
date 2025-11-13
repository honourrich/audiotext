# Deploy YouTube Unified Function with CLI

The function needs to be deployed with the `--no-verify-jwt` flag to bypass Supabase's platform-level JWT validation (same as `process-youtube-captions`).

## Steps:

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   # or
   brew install supabase/tap/supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref ootnymscbyjpzoyiydwx
   ```

4. **Deploy the function with the flag**:
   ```bash
   cd /app
   supabase functions deploy youtube-unified --no-verify-jwt
   ```

This will deploy the function without JWT verification, allowing it to accept requests without strict authentication (same as `process-youtube-captions`).

## Alternative: Use Supabase Dashboard

If you can't use CLI, you can try:
1. Go to Supabase Dashboard > Edge Functions > youtube-unified
2. Check if there's a "Settings" or "Configuration" option
3. Look for "JWT Verification" or "Authentication" settings
4. Disable JWT verification if available

However, this setting might not be available in the dashboard, so CLI deployment is recommended.

