# 🔧 Troubleshooting Edge Function Errors

## Error: HTTP 546

The HTTP 546 status code is unusual and typically indicates one of these issues:

### 1. Edge Function Not Deployed

**Most Common Cause:** The Edge Function hasn't been deployed to Supabase yet.

**Solution:**
```bash
# Deploy the audio-transcribe function
supabase functions deploy audio-transcribe

# Verify deployment
supabase functions list
```

### 2. Incorrect Function URL

**Check:** Make sure your Supabase URL is correct and the function path is right.

**Verify:**
- Your `VITE_SUPABASE_URL` should be: `https://your-project-id.supabase.co`
- Function URL should be: `${VITE_SUPABASE_URL}/functions/v1/audio-transcribe`

**Test the function:**
```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/audio-transcribe \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"audioFile":"test","fileName":"test.mp3","fileSize":1000}'
```

### 3. Missing Environment Variables

**Check:**
- `VITE_SUPABASE_URL` is set
- `VITE_SUPABASE_ANON_KEY` is set
- `OPENAI_API_KEY` is set in Supabase secrets (not Vercel)

**Verify in browser console:**
```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
```

### 4. CORS Issues

**Check:** The Edge Function should handle CORS automatically, but verify:

1. Check Edge Function logs:
   ```bash
   supabase functions logs audio-transcribe
   ```

2. Verify CORS headers in the function:
   ```typescript
   const corsHeaders = {
     'Access-Control-Allow-Origin': '*',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   };
   ```

### 5. Authentication Issues

**Check:**
- Your Supabase anon key is correct
- The key hasn't been rotated
- You're using the anon key (not the service role key)

**Verify:**
```bash
# Check your Supabase project settings
supabase status
```

## Common Error Messages and Solutions

### "Edge Function not found"
- **Cause:** Function not deployed
- **Solution:** Deploy the function: `supabase functions deploy audio-transcribe`

### "OpenAI API key not configured"
- **Cause:** `OPENAI_API_KEY` not set in Supabase secrets
- **Solution:** 
  ```bash
  supabase secrets set OPENAI_API_KEY=sk-proj-your-key-here
  ```

### "Authentication failed"
- **Cause:** Invalid or missing Supabase anon key
- **Solution:** Check `VITE_SUPABASE_ANON_KEY` in your environment variables

### "CORS error"
- **Cause:** CORS headers not set correctly
- **Solution:** Verify the Edge Function includes CORS headers in responses

## Debugging Steps

### Step 1: Check Browser Console

Open DevTools → Console and look for:
- Network errors
- CORS errors
- Authentication errors
- The actual error message (now improved)

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Try uploading a file
3. Look for the request to `/functions/v1/audio-transcribe`
4. Check:
   - Request URL (should be correct)
   - Request headers (should include Authorization)
   - Response status (should be 200, not 546)
   - Response body (should contain error details)

### Step 3: Check Supabase Logs

```bash
# View real-time logs
supabase functions logs audio-transcribe --follow

# View recent logs
supabase functions logs audio-transcribe --limit 50
```

### Step 4: Test Function Directly

Use curl or Postman to test the function:

```bash
curl -X POST https://your-project-id.supabase.co/functions/v1/audio-transcribe \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "audioFile": "base64-encoded-audio-here",
    "fileName": "test.mp3",
    "fileSize": 1000
  }'
```

## Quick Fix Checklist

- [ ] Edge Function deployed: `supabase functions deploy audio-transcribe`
- [ ] OpenAI API key set: `supabase secrets set OPENAI_API_KEY=...`
- [ ] Environment variables set: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Function URL correct: `${VITE_SUPABASE_URL}/functions/v1/audio-transcribe`
- [ ] Check browser console for detailed error messages
- [ ] Check Supabase logs for server-side errors

## Still Having Issues?

1. **Check Supabase Dashboard:**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Go to Edge Functions → Logs
   - Look for error messages

2. **Verify Function Code:**
   - Check `supabase/functions/audio-transcribe/index.ts`
   - Make sure it exports a handler function
   - Verify CORS headers are included

3. **Test with a Simple Request:**
   - Use the test-api function first to verify connectivity
   - Then test audio-transcribe with a small file

---

**Note:** The improved error handling will now show more detailed error messages in the browser console, making it easier to diagnose the issue.

