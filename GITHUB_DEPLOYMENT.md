# GitHub Setup & Deployment Guide

## 📝 Prerequisites

- GitHub account
- Git installed on your machine
- Supabase project with credentials
- Project files ready to commit

## 🔧 Initial GitHub Setup

### 1. Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "+" → "New repository"
3. Name: `nexora` (or your preferred name)
4. Description: "Professional Private Portal with Supabase"
5. Choose:
   - **Public** (to show off your work)
   - **Private** (if sensitive)
6. Add `.gitignore` for Node
7. Click "Create repository"

### 2. Initialize Git Locally

```bash
# Navigate to project directory
cd ~/Documents/secretapp

# Initialize git (if not already done)
git init

# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/nexora.git

# Verify remote
git remote -v
```

### 3. Create `.gitignore`

Create a `.gitignore` file in the project root:

```
# Environment variables
.env
.env.local
.env.*.local

# Node/npm
node_modules/
package-lock.json
npm-debug.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/

# Logs
logs/
*.log

# Cache
.cache/
.parcel-cache/
```

### 4. Stage and Commit Initial Files

```bash
# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit: Nexora app setup"

# Create main branch and push
git branch -M main
git push -u origin main
```

## 📤 Making Updates

After making changes to your code:

```bash
# Check what changed
git status

# Stage specific files
git add path/to/file.js

# Or stage all changes
git add .

# Commit with descriptive message
git commit -m "Feature: Add image filters to gallery"

# Push to GitHub
git push origin main
```

## 🏷️ Version Tags

Tag important releases:

```bash
# Create a tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push origin --tags

# View all tags
git tag -l
```

## ⚠️ Important: Disable GitHub Pages

**Do NOT use GitHub Pages for deployment.** This project uses clean URLs (`/workspace`, `/login`, `/gallery`, etc.) which require a special server configuration. 

### Disable GitHub Pages in Your Repository:

1. Go to your GitHub repository
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under "Source", select **None** (or leave it disabled)
4. This prevents GitHub Pages from conflicting with Vercel

**Why?** GitHub Pages is a static file server and doesn't support clean URL routing. Use **Vercel** instead (see next section).

---

## 🚀 Deploy to Vercel from GitHub

### Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel to access your GitHub account

### Step 2: Import Repository

1. Go to Vercel Dashboard
2. Click "Add New..." → "Project"
3. Select your `nexora` repository
4. Click "Import"

### Step 3: Configure Environment Variables

1. In "Environment Variables" section, add:

```
Name: VITE_SUPABASE_URL
Value: https://your-project.supabase.co

Name: VITE_SUPABASE_ANON_KEY
Value: your_anon_key_here
```

2. Click "Add Environment Variable" for each one

### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. You'll get a URL like: `https://nexora-xyz.vercel.app`

### Step 5: Configure Custom Domain (Optional)

1. Go to project settings
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## 🔄 Continuous Deployment

Every time you push to GitHub:

1. Vercel automatically detects the push
2. Builds your project
3. Deploys to production
4. Updates your live URL

No additional steps needed!

## 📊 GitHub Repository Settings

### Recommended Settings

1. **Protect Main Branch**
   - Settings → Branches
   - Add rule for `main`
   - Require pull request reviews

2. **Enable Issues**
   - For bug tracking and feature requests

3. **Enable Discussions**
   - For community conversations

4. **Add Collaborators**
   - Settings → Collaborators
   - Add team members if needed

## 📝 README.md

Make sure your README.md includes:

- ✅ Project description
- ✅ Features list
- ✅ Installation instructions
- ✅ Usage examples
- ✅ Configuration guide
- ✅ Deployment instructions
- ✅ License

*Already included in this project!*

## 🔐 Secrets Management

### Never Commit Secrets!

```bash
# ❌ WRONG - Don't do this
git add .env
git commit -m "Add credentials"

# ✅ RIGHT - Use .gitignore
echo ".env.local" >> .gitignore
git add .gitignore
```

### Safe Secret Management

1. **Local Development**
   - Use `.env.local` (in .gitignore)
   - Never commit to GitHub

2. **Vercel Deployment**
   - Add secrets in Vercel settings
   - Never in code

3. **Team Collaboration**
   - Share secrets securely (1Password, LastPass)
   - Not through GitHub

## 📋 Commit Message Guidelines

Follow semantic commit format:

```
feat: Add image filters
fix: Correct logout redirect
docs: Update README with setup instructions
style: Refactor CSS animations
refactor: Reorganize gallery components
test: Add authentication tests
chore: Update dependencies
```

### Examples

```bash
git commit -m "feat: Add admin activity logs view"
git commit -m "fix: Resolve image lazy-loading bug"
git commit -m "docs: Add deployment guide"
```

## 🔄 Pull Requests (for Teams)

If working with a team:

```bash
# Create feature branch
git checkout -b feature/add-search

# Make changes and commit
git add .
git commit -m "feat: Add gallery search"

# Push branch
git push origin feature/add-search

# Create pull request on GitHub
# Go to GitHub → Pull Requests → New Pull Request
```

## 📊 Monitoring Deployments

On Vercel Dashboard:

1. **Deployments Tab**
   - See all deployment history
   - View build logs
   - Rollback if needed

2. **Analytics Tab**
   - View page load times
   - Monitor web vitals
   - Track traffic

3. **Logs Tab**
   - Server error logs
   - Function logs
   - Request logs

## 🆘 Troubleshooting

### Build Fails on Vercel

1. Check build logs in Vercel
2. Verify environment variables are set
3. Ensure all files committed to GitHub
4. Check for missing dependencies

### Changes Not Live

1. Verify push succeeded: `git push -v`
2. Check GitHub shows latest commit
3. Wait for Vercel build to complete
4. Hard refresh browser (Ctrl+Shift+R)

### Environment Variables Missing

1. Go to Vercel Settings → Environment Variables
2. Re-add all variables
3. Trigger new deployment
4. Hard refresh and test

## 📚 Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [Vercel Docs](https://vercel.com/docs)
- [Semantic Commits](https://www.conventionalcommits.org/)

## ✅ Deployment Checklist

Before pushing to production:

- [ ] Test locally with `npm test` or manual testing
- [ ] Update README with latest features
- [ ] Ensure `.env.local` is in `.gitignore`
- [ ] Verify all environment variables set in Vercel
- [ ] Test Supabase connection
- [ ] Check all links work
- [ ] Test on mobile
- [ ] Review code with team
- [ ] Commit with descriptive message
- [ ] Push and verify deployment

## 🎯 Next Steps

1. **Set up repository** following steps above
2. **Configure Vercel** for automatic deployment
3. **Add team members** if collaborating
4. **Set up GitHub issues** for tracking
5. **Create project board** for organization
6. **Document** any custom setup

---

**Happy coding! 🚀**
