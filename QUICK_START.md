# Quick Start - Get Running in 10 Minutes

## 1. Get Database URL (5 min)

1. Sign up at [supabase.com](https://supabase.com)
2. Create new project → Wait 2 minutes
3. Go to **Settings** → **Database**
4. Copy **Connection String** (URI)
5. Replace `[YOUR-PASSWORD]` with your database password

## 2. Set Up Local Environment (2 min)

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and paste your DATABASE_URL
# DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

## 3. Create Database Tables (1 min)

```bash
npm run db:push
```

## 4. Create First Admin Account (2 min)

1. Hash a password:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(h => console.log(h))"
   ```

2. Go to Supabase → **SQL Editor** → Run:
   ```sql
   INSERT INTO vendors (username, email, password)
   VALUES (
     'admin',
     'admin@redimi.co',
     '$2a$10$PASTE_YOUR_HASHED_PASSWORD_HERE'
   );
   ```

## 5. Start Server

```bash
npm run dev
```

## 6. Login

- Open http://localhost:5000
- Username: `admin`
- Password: `admin123` (or whatever you set)

## Done! 🎉

Your app is running. The first login will automatically create default settings.

## Deploy to Railway (Optional)

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. New Project → Deploy from GitHub
4. Add environment variables:
   - `DATABASE_URL` (from Supabase)
   - `SESSION_SECRET` (generate: `openssl rand -base64 32`)
   - `NODE_ENV=production`
5. Deploy!

