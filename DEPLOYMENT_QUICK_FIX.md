# Quick Fix for Console Errors

## 🐛 **Current Issues:**
- CORS error when trying to access YouTube caption processing
- Edge Function `process-youtube-captions` not deployed
- Network failures due to missing function

## ✅ **Immediate Fix Applied:**
I've updated the error handling to show user-friendly messages instead of raw CORS errors.

## 🚀 **To Fully Fix - Deploy the Edge Function:**

### **Option 1: Using Supabase CLI (Recommended)**

```bash
# 1. Login to Supabase
npx supabase login

# 2. Link your project
npx supabase link --project-ref ootnymscbyjpzoyiydwx

# 3. Deploy the function
npx supabase functions deploy process-youtube-captions

# 4. Set environment variables
npx supabase secrets set OPENAI_API_KEY="your-openai-key-here"
npx supabase secrets set CLERK_SECRET_KEY="your-clerk-secret-key-here"
```

### **Option 2: Manual Deployment via Supabase Dashboard**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ootnymscbyjpzoyiydwx)
2. Navigate to **Edge Functions** in the left sidebar
3. Click **"Create a new function"**
4. Name it: `process-youtube-captions`
5. Copy the code from: `supabase/functions/process-youtube-captions/index.ts`
6. Paste it into the function editor
7. Click **Deploy**
8. Go to **Settings** → **Edge Functions** → **Environment Variables**
9. Add:
   - `OPENAI_API_KEY` = your OpenAI API key
   - `CLERK_SECRET_KEY` = your Clerk secret key

### **Option 3: Test with Mock Data (Temporary)**

If you want to test the UI without deploying, I can modify the code to use mock data temporarily.

## 🎯 **After Deployment:**

The YouTube Caption Extraction feature will work fully:
- ✅ Extract captions from YouTube videos
- ✅ Generate AI content
- ✅ Save episodes to dashboard
- ✅ No more CORS errors

## 📞 **Need Help?**

If you need help with the deployment process, let me know and I can guide you through it step by step!
