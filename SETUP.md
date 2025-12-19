# Setup Guide - Pointy Loyalty System (REDIMI.CO)

This guide will walk you through setting up the application with Option A (Budget tier) infrastructure.

## Prerequisites

- Node.js 18+ installed
- A PostgreSQL database (we'll set up Supabase free tier)
- A hosting service (we'll use Railway free tier)

## Step 1: Set Up Database (Supabase)

1. Go to [supabase.com](https://supabase.com) and sign up for a free account
2. Create a new project:
   - Name: `redimi-loyalty` (or your choice)
   - Database Password: **Save this password!**
   - Region: Choose closest to you
3. Wait for project to be created (~2 minutes)
4. Once ready, go to **Settings** → **Database**
5. Copy the **Connection String** (URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with your actual password

## Step 2: Set Up Hosting (Railway)

1. Go to [railway.app](https://railway.app) and sign up (GitHub login recommended)
2. Click **New Project** → **Deploy from GitHub repo**
   - Connect your GitHub account if needed
   - Select this repository
3. Add Environment Variables:
   - Click on your project → **Variables** tab
   - Add these variables:
     ```
     DATABASE_URL=your_supabase_connection_string_here
     NODE_ENV=production
     PORT=5000
     SESSION_SECRET=generate_random_string_here
     ```
   - To generate SESSION_SECRET, run: `openssl rand -base64 32`

## Step 3: Local Development Setup

1. Clone this repository (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd PointyLoyaltySystem
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and add your database URL:
   ```
   DATABASE_URL=your_supabase_connection_string_here
   PORT=5000
   NODE_ENV=development
   SESSION_SECRET=your-local-secret-here
   ```

5. Push database schema:
   ```bash
   npm run db:push
   ```
   This creates all the tables in your database.

6. Create your first vendor account:
   ```bash
   # You can use a simple script or directly in the database
   # For now, we'll create it via the app after first run
   ```

7. Start development server:
   ```bash
   npm run dev
   ```

8. Open browser to `http://localhost:5000`

## Step 4: Create First Vendor Account

Since we don't have a signup page yet, create your first vendor via SQL:

1. Go to Supabase Dashboard → **SQL Editor**
2. Run this query (replace with your own values):
   ```sql
   INSERT INTO vendors (username, email, password)
   VALUES (
     'admin',
     'admin@redimi.co',
     '$2a$10$YourHashedPasswordHere'
   );
   ```
   
   **To hash a password**, use this Node.js one-liner:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('yourpassword', 10).then(h => console.log(h))"
   ```
   
   Or use an online bcrypt generator: https://bcrypt-generator.com/
   - Rounds: 10
   - Enter your password
   - Copy the hash

3. After inserting, the app will automatically create default settings and a "Main Store" branch on first login.

## Step 5: Deploy to Production

### Option A: Railway (Recommended for Budget)

1. Your code is already connected to Railway (from Step 2)
2. Railway will automatically:
   - Build your app when you push to GitHub
   - Deploy it
   - Give you a URL like `https://your-app.railway.app`

3. Set up custom domain (optional):
   - In Railway project → **Settings** → **Domains**
   - Add your domain
   - Follow DNS instructions

### Option B: Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. The built files are in `dist/`:
   - `dist/index.cjs` - Server
   - `dist/public/` - Client files

3. Deploy to your server:
   ```bash
   # On your server
   NODE_ENV=production DATABASE_URL=... SESSION_SECRET=... PORT=5000 node dist/index.cjs
   ```

4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start dist/index.cjs --name redimi --env production
   pm2 save
   pm2 startup
   ```

## Step 6: Connect to WordPress (Optional)

### Option 1: Subdomain Setup
- Point `app.yourdomain.com` to your Railway/deployed app
- Keep WordPress on `yourdomain.com`

### Option 2: Reverse Proxy (Nginx)
Add to your Nginx config:
```nginx
location /app {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### Option 3: WordPress Widget/Link
- Add a simple link or iframe in WordPress pointing to your app
- Or create a WordPress plugin that embeds the customer lookup

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `PORT` | Server port | No | 5000 |
| `NODE_ENV` | Environment (development/production) | No | development |
| `SESSION_SECRET` | Secret for session encryption | Yes (production) | - |

## Troubleshooting

### Database Connection Issues
- Check your `DATABASE_URL` is correct
- Ensure Supabase allows connections from your IP (Settings → Database → Connection Pooling)
- For Railway, use the "Connection Pooling" URL from Supabase

### Session Issues
- Make sure `SESSION_SECRET` is set and consistent
- In production, ensure cookies work (HTTPS, correct domain)

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check Node.js version: `node --version` (should be 18+)

### First Login Issues
- Make sure you created a vendor account in the database
- Check browser console for errors
- Check server logs in Railway dashboard

## Next Steps

1. **Add WhatsApp Integration**: Set up Twilio WhatsApp API
2. **Add Email Notifications**: Configure email service (Resend, SendGrid)
3. **Add Payment Processing**: Integrate Stripe for subscriptions
4. **Add Signup Page**: Create vendor registration flow
5. **Add Analytics**: Track usage and metrics

## Support

For issues or questions:
- Check server logs in Railway dashboard
- Check Supabase logs in Supabase dashboard
- Review error messages in browser console

## Cost Summary (Option A - Budget)

- **Supabase**: Free tier (up to 500MB database, 2GB bandwidth)
- **Railway**: Free tier ($5 credit/month, ~500 hours)
- **Total**: ~$0-5/month for first 100 vendors

When you outgrow free tiers:
- Supabase Pro: $25/month
- Railway Hobby: $5-20/month
- **Total**: ~$30-45/month

