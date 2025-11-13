# 🚨 OpenAI API Key Security Fix

## ⚠️ CRITICAL: Your API Key Was Leaked

Your OpenAI API key was found **hardcoded** in the repository file `test-whisper.html`. This is why OpenAI disabled it.

## ✅ Immediate Actions Required

### 1. Create a New OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. **Copy the key immediately** (you won't see it again)
4. Name it something like "AudioText Production" or "AudioText Dev"

### 2. Update All Locations

#### A. Local Development (`.env.local`)

Update `/app/.env.local`:

```bash
VITE_OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
```

**Important:** Make sure `.env.local` is in `.gitignore` (it already is ✅)

#### B. Vercel (Production)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_OPENAI_API_KEY`
5. Click **Edit** and update with your new key
6. **Redeploy** your application

#### C. Supabase Edge Functions

Update the secret in Supabase:

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-YOUR_NEW_KEY_HERE
```

Or via Supabase Dashboard:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Update `OPENAI_API_KEY` with your new key

### 3. Remove Old Key from Git History (IMPORTANT)

The old key is still in your git history. You should remove it:

```bash
# Option 1: Use git filter-repo (recommended)
git filter-repo --path test-whisper.html --invert-paths --force

# Option 2: Use BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
bfg --replace-text passwords.txt

# Option 3: Manual cleanup (if above don't work)
# This will rewrite history - coordinate with your team
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch test-whisper.html" \
  --prune-empty --tag-name-filter cat -- --all
```

**⚠️ Warning:** Rewriting git history will require force-pushing. Coordinate with your team first.

### 4. Verify No Other Keys Are Exposed

Run this command to check for any other exposed keys:

```bash
# Search for potential API keys in the codebase
grep -r "sk-proj-" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "sk_live_" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "sk_test_" . --exclude-dir=node_modules --exclude-dir=.git
```

## 🔒 Security Best Practices Going Forward

### ✅ DO:
- ✅ Always use environment variables (`.env.local` for local, Vercel/Supabase for production)
- ✅ Keep `.env.local` in `.gitignore` (already done ✅)
- ✅ Use different keys for development and production
- ✅ Rotate keys periodically
- ✅ Monitor OpenAI usage dashboard for suspicious activity

### ❌ DON'T:
- ❌ **NEVER** commit API keys to git
- ❌ **NEVER** hardcode keys in source files
- ❌ **NEVER** share keys in screenshots, emails, or chat
- ❌ **NEVER** use production keys in local development

## 📋 Checklist

- [ ] Created new OpenAI API key
- [ ] Updated `.env.local` with new key
- [ ] Updated Vercel environment variables
- [ ] Updated Supabase secrets
- [ ] Removed old key from git history
- [ ] Verified no other keys are exposed
- [ ] Tested transcription feature works
- [ ] Tested AI chat feature works
- [ ] Redeployed application

## 🧪 Testing After Update

1. **Local Testing:**
   ```bash
   npm run dev
   # Try uploading an audio file and transcribing
   # Try using the AI chat feature
   ```

2. **Production Testing:**
   - Visit your deployed app
   - Test transcription
   - Test AI chat
   - Check browser console for errors

## 📞 If Issues Persist

If you still see errors after updating:

1. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
2. **Restart dev server** after updating `.env.local`
3. **Check Vercel logs** for environment variable issues
4. **Verify Supabase secrets** are set correctly
5. **Check OpenAI dashboard** to ensure key is active and has credits

---

**Remember:** API keys are like passwords - treat them with the same security level!

