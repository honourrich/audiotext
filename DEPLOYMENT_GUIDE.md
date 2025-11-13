# ShowNote AI - Deployment Guide

## 🚀 Quick Start

### 1. Environment Setup
Create `.env.local` file with your API keys:
```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here

# Supabase Database
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI API
VITE_OPENAI_API_KEY=sk-proj-your_key_here
```

### 2. Install & Run
```bash
npm install
npm run dev
```

### 3. Build for Production
```bash
npm run build
npm run preview
```

## 🔧 Required Services

### 1. Clerk (Authentication)
- Sign up at [clerk.com](https://clerk.com)
- Create a new application
- Copy the publishable key to `.env.local`

### 2. Supabase (Database)
- Sign up at [supabase.com](https://supabase.com)
- Create a new project
- Copy URL and anon key to `.env.local`
- Run migrations from `supabase/migrations/`

### 3. OpenAI (Transcription)
- Sign up at [platform.openai.com](https://platform.openai.com)
- Create an API key
- Add credits to your account
- Copy key to `.env.local`

## 📦 Local Backup

Your project has been backed up to:
- `../shownote-ai-backup-20250915-221826.tar.gz` (1.8MB)

To restore from backup:
```bash
tar -xzf shownote-ai-backup-20250915-221826.tar.gz
cd shownote-ai
npm install
```

## 🌐 Deployment Options

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy automatically

### Netlify
1. Connect repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables

### Self-hosted
1. Build the project: `npm run build`
2. Serve the `dist` folder with any web server
3. Ensure all environment variables are set

## 🔍 Troubleshooting

### Common Issues
1. **Blank screen** - Check environment variables
2. **Transcription fails** - Verify OpenAI API key and credits
3. **Database errors** - Check Supabase connection
4. **Authentication issues** - Verify Clerk configuration

### Debug Steps
1. Check browser console for errors
2. Verify all API keys are correct
3. Test with small audio files first
4. Check network requests in dev tools

## 📊 Performance Tips

- Use compressed audio files when possible
- Monitor OpenAI API usage and costs
- Set up proper error monitoring
- Consider implementing caching for repeated requests

---

**Ready to deploy!** 🎉
