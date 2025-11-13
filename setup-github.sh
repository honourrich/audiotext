#!/bin/bash

echo "🚀 ShowNote AI - GitHub Setup Script"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Check git status
echo "🔍 Checking git status..."
git status --porcelain
echo ""

# Show current remote
echo "🌐 Current remote repository:"
git remote -v
echo ""

echo "📋 Next steps:"
echo "1. Create a new repository on GitHub.com"
echo "2. Copy the repository URL (e.g., https://github.com/username/repo-name.git)"
echo "3. Run these commands:"
echo ""
echo "   git remote remove origin"
echo "   git remote add origin YOUR_GITHUB_REPO_URL"
echo "   git push -u origin main"
echo ""
echo "4. Deploy with Vercel or Netlify:"
echo "   - Vercel: https://vercel.com (recommended)"
echo "   - Netlify: https://netlify.com"
echo ""
echo "5. Add these environment variables in your deployment platform:"
echo "   - VITE_CLERK_PUBLISHABLE_KEY"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - VITE_OPENAI_API_KEY"
echo ""

echo "✅ Your project is ready to deploy!"
echo "📖 Check PROJECT_SUMMARY.md and DEPLOYMENT_GUIDE.md for detailed instructions"
