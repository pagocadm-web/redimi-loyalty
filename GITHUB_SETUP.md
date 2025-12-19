# GitHub Repository Setup Guide

Your code is ready to push to GitHub! Follow these steps:

## Step 1: Create GitHub Repository

1. **Go to GitHub**
   - Visit https://github.com
   - Sign in (or create account if needed)

2. **Create New Repository**
   - Click the **"+"** icon in top right → **"New repository"**
   - Repository name: `redimi-loyalty` (or `redimi-co`, `pointy-loyalty`, etc.)
   - Description: "REDIMI.CO - Customer Loyalty Points Management System"
   - Visibility: **Private** (recommended) or **Public**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click **"Create repository"**

3. **Copy the Repository URL**
   - GitHub will show you commands, but you'll see something like:
   - `https://github.com/YOUR_USERNAME/redimi-loyalty.git`
   - Or SSH: `git@github.com:YOUR_USERNAME/redimi-loyalty.git`
   - **Copy this URL** (you'll need it in the next step)

## Step 2: Connect Local Repository to GitHub

Run these commands in your terminal (replace `YOUR_USERNAME` and `redimi-loyalty` with your actual values):

```bash
cd /Users/pabgomez/Documents/PointyLoyaltySystem

# Add GitHub as remote (use the URL from Step 1)
git remote add origin https://github.com/YOUR_USERNAME/redimi-loyalty.git

# Verify remote was added
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

**If you get authentication errors:**
- GitHub requires authentication (no more passwords)
- Use a **Personal Access Token** or **SSH key**

### Option A: Personal Access Token (Easiest)

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Name: "Railway Deployment"
4. Select scopes: Check `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you'll only see it once!)
7. When pushing, use the token as your password:
   ```bash
   git push -u origin main
   # Username: your-github-username
   # Password: paste-your-token-here
   ```

### Option B: SSH Key (More Secure)

1. Generate SSH key (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Press Enter to accept default location
   # Enter a passphrase (optional but recommended)
   ```

2. Add SSH key to GitHub:
   ```bash
   # Copy your public key
   cat ~/.ssh/id_ed25519.pub
   # Copy the output
   ```
   - Go to GitHub → Settings → SSH and GPG keys
   - Click "New SSH key"
   - Paste your public key
   - Click "Add SSH key"

3. Use SSH URL instead:
   ```bash
   git remote set-url origin git@github.com:YOUR_USERNAME/redimi-loyalty.git
   git push -u origin main
   ```

## Step 3: Verify Push

After pushing, refresh your GitHub repository page. You should see:
- ✅ All your files
- ✅ README.md
- ✅ All source code
- ✅ Documentation files

**Important:** Make sure `.env` file is **NOT** in the repository (it should be in `.gitignore`)

## Step 4: Ready for Railway!

Once your code is on GitHub, you can:
1. Go to Railway.app
2. New Project → Deploy from GitHub
3. Select your repository
4. Railway will auto-detect and deploy!

---

## Quick Command Reference

```bash
# Check status
git status

# See what will be committed
git status --short

# Add all changes
git add .

# Commit changes
git commit -m "Your commit message"

# Push to GitHub
git push origin main

# Check remote
git remote -v
```

---

## Troubleshooting

**"Repository not found"**
- Check repository name is correct
- Verify you have access (if private repo)
- Make sure you're authenticated

**"Authentication failed"**
- Use Personal Access Token instead of password
- Or set up SSH keys

**"Permission denied"**
- Make sure you're the owner of the repository
- Or have write access if it's someone else's repo

**".env file is in repository"**
- Remove it: `git rm --cached .env`
- Commit: `git commit -m "Remove .env from repository"`
- Push: `git push origin main`
- Verify `.env` is in `.gitignore`

---

## Security Reminder

✅ **DO commit:**
- Source code
- Configuration files (without secrets)
- Documentation
- `.env.example` (template file)

❌ **DON'T commit:**
- `.env` (contains database passwords)
- `node_modules/`
- `dist/` (build output)
- Any files with API keys or secrets

Your `.gitignore` is already configured to exclude these! ✅

