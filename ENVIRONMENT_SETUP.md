# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Clerk Authentication (MUST be a test key for local development)
# Production keys (pk_live_...) will NOT work on localhost
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key_here

# Supabase Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI API (Required for transcription AND AI chat features)
VITE_OPENAI_API_KEY=sk-proj-your_openai_key_here

# Tempo DevTools (optional)
VITE_TEMPO=false
```

## Important Notes

### OpenAI API Key
- **Required for both transcription and AI chat features**
- Must have GPT-4 access for the chat functionality
- Get your API key from: https://platform.openai.com/api-keys
- Ensure you have sufficient credits in your OpenAI account

### Clerk Authentication
- **For Local Development:** Use a **test/development** key (starts with `pk_test_...`)
  - Get it from: https://dashboard.clerk.com/ → Your Application → API Keys
  - Test keys work on `localhost` and any domain
  - **DO NOT use production keys (`pk_live_...`) for local development** - they are restricted to your production domain
- **For Production:** Use production keys (`pk_live_...`) only in Vercel environment variables
- Used for user authentication and session management

### Supabase
- Get your URL and anon key from: https://supabase.com/dashboard
- Used for database operations and edge functions

## Troubleshooting

### AI Chat Not Working
1. Check that `VITE_OPENAI_API_KEY` is set correctly
2. Verify your OpenAI API key has GPT-4 access
3. Ensure you have sufficient credits in your OpenAI account
4. Check browser console for error messages

### Transcription Not Working
1. Verify `VITE_OPENAI_API_KEY` is set
2. Check that your OpenAI account has sufficient credits
3. Ensure the API key has Whisper API access

### General Issues
1. Restart your development server after changing environment variables
2. Check that all required variables are present
3. Verify there are no typos in variable names
4. Ensure `.env.local` is in the root directory (same level as package.json)
