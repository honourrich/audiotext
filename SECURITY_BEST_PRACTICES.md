# 🔒 Security Best Practices for API Keys

## ⚠️ Critical Security Notice

**Your OpenAI API key was leaked and disabled by OpenAI.** This document outlines security best practices to prevent future leaks.

## 🚨 Current Security Status

### ✅ Fixed Issues
- ✅ Removed API key information from `test-api` endpoint responses
- ✅ Removed console.log statements that expose API key metadata
- ✅ Secured server-side logging to prevent key exposure

### ⚠️ Known Security Risks

#### Client-Side API Key Usage
**CRITICAL:** Your application currently uses OpenAI API keys **client-side** (in the browser). This is a **major security risk** because:

1. **API keys are exposed in browser network requests** - Anyone can view them in DevTools → Network tab
2. **API keys are visible in bundled JavaScript** - They can be extracted from the source code
3. **No access control** - Anyone with the key can use it, leading to unauthorized usage and costs
4. **Key rotation is difficult** - If compromised, you must update all deployed instances

**Files using client-side API keys:**
- `src/lib/youtube-transcription.ts` - Uses `dangerouslyAllowBrowser: true`
- `src/components/UploadModal.tsx` - Direct API calls from browser
- `src/components/TranscriptChat.tsx` - Direct API calls from browser
- `src/lib/socialMedia.ts` - Direct API calls from browser

## 🛡️ Recommended Security Improvements

### Option 1: Move All API Calls to Server-Side (RECOMMENDED)

**Best Practice:** All OpenAI API calls should go through Supabase Edge Functions or your backend.

**Benefits:**
- ✅ API keys never exposed to clients
- ✅ Better access control and rate limiting
- ✅ Easier key rotation
- ✅ Usage monitoring and logging
- ✅ Cost control

**Implementation:**
1. Create Supabase Edge Functions for all OpenAI operations:
   - `transcribe-audio` (already exists ✅)
   - `chat-completion` (create new)
   - `generate-content` (already exists ✅)

2. Update client-side code to call Edge Functions instead of OpenAI directly

3. Remove `VITE_OPENAI_API_KEY` from client-side environment variables

4. Keep `OPENAI_API_KEY` only in Supabase secrets

### Option 2: Use API Key Restrictions (If Client-Side is Required)

If you must use client-side keys (not recommended):

1. **Set up API key restrictions in OpenAI Dashboard:**
   - Go to https://platform.openai.com/api-keys
   - Click on your key → Edit
   - Set **IP allowlist** (if possible)
   - Set **usage limits** (daily/monthly)
   - Enable **usage alerts**

2. **Use separate keys for different environments:**
   - Development key (with low limits)
   - Production key (with restrictions)

3. **Monitor usage regularly:**
   - Check OpenAI dashboard daily
   - Set up alerts for unusual activity
   - Rotate keys monthly

## 📋 Security Checklist

### Immediate Actions (Required)
- [x] Create new OpenAI API key
- [x] Remove API key information from test endpoints
- [x] Remove console.log statements exposing key metadata
- [ ] Update all environment variables (local, Vercel, Supabase)
- [ ] Verify no keys are in git history
- [ ] Test application with new key

### Short-Term Improvements (Recommended)
- [ ] Move all OpenAI API calls to Supabase Edge Functions
- [ ] Remove `VITE_OPENAI_API_KEY` from client-side code
- [ ] Implement authentication for all API endpoints
- [ ] Add rate limiting to API endpoints
- [ ] Set up usage monitoring and alerts

### Long-Term Best Practices
- [ ] Rotate API keys quarterly
- [ ] Use separate keys for dev/staging/production
- [ ] Implement API key restrictions in OpenAI dashboard
- [ ] Regular security audits
- [ ] Monitor for suspicious usage patterns

## 🔍 How to Check for Exposed Keys

### 1. Search Git History
```bash
# Search for actual API keys (not placeholders)
git log --all --full-history -p -S "sk-proj-" | grep -A 5 -B 5 "sk-proj-[a-zA-Z0-9]{32,}"

# Search for other key patterns
git log --all --full-history -p | grep -E "sk-[a-zA-Z0-9]{32,}"
```

### 2. Search Current Codebase
```bash
# Search for hardcoded keys (should return nothing)
grep -r "sk-proj-[a-zA-Z0-9]\{32,\}" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist

# Search for key patterns in code
grep -r "sk-pro" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist
```

### 3. Check Deployed Environments
- **Vercel:** Review build logs and function logs
- **Supabase:** Review Edge Function logs
- **GitHub:** Check if secrets are stored in GitHub Secrets (Settings → Secrets)

### 4. Check Browser Exposure
1. Open your deployed application
2. Open DevTools → Network tab
3. Perform an action that uses OpenAI API
4. Check if API key is visible in request headers
5. If yes, **this is a security risk** - move to server-side

## 🚫 What NOT to Do

### ❌ NEVER:
- ❌ Commit API keys to git (even in `.env` files)
- ❌ Hardcode keys in source files
- ❌ Share keys in screenshots, emails, or chat
- ❌ Use production keys in local development
- ❌ Log API keys or key metadata
- ❌ Expose keys in API responses
- ❌ Use client-side API keys without restrictions

### ✅ ALWAYS:
- ✅ Use environment variables
- ✅ Keep `.env` files in `.gitignore`
- ✅ Use different keys for dev/prod
- ✅ Rotate keys regularly
- ✅ Monitor usage and set alerts
- ✅ Use server-side API calls when possible

## 📞 If Your Key is Compromised

1. **Immediately disable the key** in OpenAI dashboard
2. **Create a new key**
3. **Update all environments:**
   - Local `.env.local`
   - Vercel environment variables
   - Supabase secrets
4. **Review usage logs** to see if unauthorized usage occurred
5. **Check for exposed keys** in git history and deployed environments
6. **Implement security improvements** from this document

## 📚 Additional Resources

- [OpenAI API Key Safety Guide](https://platform.openai.com/docs/guides/safety-best-practices)
- [Preventing Unauthorized Usage](https://platform.openai.com/docs/guides/production-best-practices)
- [Supabase Edge Functions Security](https://supabase.com/docs/guides/functions/security)

---

**Remember:** API keys are like passwords - treat them with the same security level!

**Last Updated:** After API key leak incident
**Status:** Security improvements implemented, client-side usage still needs migration

