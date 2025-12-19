# WordPress Deployment Guide - tometintico.com

This guide will help you deploy REDIMI.CO as a testing app on your WordPress domain **tometintico.com** without affecting your existing WordPress site.

## 🎯 Deployment Options

You have **3 safe options** that won't touch your WordPress installation:

### Option 1: Subdomain (Recommended - Easiest & Safest)
**URL:** `app.tometintico.com` or `redimi.tometintico.com`

**Pros:**
- ✅ Completely isolated from WordPress
- ✅ No WordPress files touched
- ✅ Easy to set up
- ✅ Can use different server/port
- ✅ Easy to remove later

### Option 2: Subdirectory with Reverse Proxy
**URL:** `tometintico.com/app` or `tometintico.com/redimi`

**Pros:**
- ✅ Looks integrated with your site
- ✅ No WordPress files modified
- ✅ Uses Nginx reverse proxy

**Cons:**
- ⚠️ Requires Nginx configuration
- ⚠️ Slightly more complex

### Option 3: Separate Port
**URL:** `tometintico.com:3000` or `tometintico.com:8080`

**Pros:**
- ✅ Very simple
- ✅ No configuration needed

**Cons:**
- ⚠️ Port number in URL (less professional)
- ⚠️ May be blocked by firewalls

---

## 🚀 Recommended: Option 1 - Subdomain Setup

### Prerequisites
- Access to your domain DNS settings
- Server/hosting with Node.js support (or use Railway/Render)
- SSH access to your server (if self-hosting)

### Step-by-Step Guide

#### Part A: Deploy the Application

**Option A1: Deploy to Railway (Easiest - Recommended)**

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Deploy on Railway**
   - Go to https://railway.app
   - Sign up/login
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect and build

3. **Configure Environment Variables**
   - In Railway project → **Variables** tab
   - Add these variables:
     ```
     DATABASE_URL=your_supabase_connection_string
     SESSION_SECRET=your-session-secret-from-local-env
     NODE_ENV=production
     PORT=5000
     ```
   - Use the same values from your local `.env` file

4. **Get Railway URL**
   - Railway will give you a URL like: `https://your-app.railway.app`
   - Copy this URL (you'll need it for DNS)

**Option A2: Deploy to Your Own Server**

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Upload to your server**
   - Upload the entire project folder to your server
   - Or use git: `git clone <your-repo>` on server

3. **Install dependencies and build**
   ```bash
   npm install --production
   npm run build
   ```

4. **Set up environment variables**
   ```bash
   # Create .env file on server
   nano .env
   # Add your DATABASE_URL, SESSION_SECRET, etc.
   ```

5. **Start with PM2**
   ```bash
   npm install -g pm2
   pm2 start dist/index.cjs --name redimi --env production
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

#### Part B: Configure DNS (Subdomain)

1. **Go to your domain registrar** (where you manage tometintico.com)

2. **Add DNS Record**
   - Type: **CNAME** (or **A** record if using IP)
   - Name: `app` (or `redimi`, `test`, etc.)
   - Value: 
     - If using Railway: `your-app.railway.app` (Railway will give you this)
     - If using your server: Your server's IP address or hostname
   - TTL: 3600 (or default)

3. **Wait for DNS propagation** (5 minutes to 24 hours, usually ~15 minutes)

4. **Verify DNS**
   ```bash
   # Check if DNS is working
   nslookup app.tometintico.com
   # or
   dig app.tometintico.com
   ```

#### Part C: Configure SSL Certificate (HTTPS)

**If using Railway:**
- Railway automatically provides SSL certificates
- Once DNS propagates, Railway will auto-configure HTTPS
- Your app will be available at `https://app.tometintico.com`

**If using your own server:**

1. **Install Certbot**
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Get SSL Certificate**
   ```bash
   sudo certbot certonly --standalone -d app.tometintico.com
   ```

3. **Configure Nginx** (see Option 2 section below for Nginx config)

---

## 🔧 Option 2: Subdirectory Setup (Nginx Reverse Proxy)

If you prefer `tometintico.com/app` instead of a subdomain:

### Step 1: Deploy Application
- Follow Part A above to deploy your app
- Note the port your app runs on (e.g., 3000, 5000, or Railway's port)

### Step 2: Configure Nginx

**Important:** This only modifies Nginx config, NOT WordPress files!

1. **SSH into your server**

2. **Edit Nginx configuration**
   ```bash
   sudo nano /etc/nginx/sites-available/tometintico.com
   # or wherever your WordPress Nginx config is
   ```

3. **Add location block** (add this INSIDE your existing `server` block, BEFORE the WordPress location block):
   ```nginx
   # REDIMI.CO App - Reverse Proxy
   location /app {
       proxy_pass http://localhost:3000;  # Change port if different
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_cache_bypass $http_upgrade;
       
       # Remove /app prefix when forwarding
       rewrite ^/app/?(.*) /$1 break;
   }
   
   # Your existing WordPress location block stays unchanged
   location / {
       # ... existing WordPress config ...
   }
   ```

4. **Test Nginx configuration**
   ```bash
   sudo nginx -t
   ```

5. **Reload Nginx**
   ```bash
   sudo systemctl reload nginx
   ```

6. **Access your app**
   - Go to: `https://tometintico.com/app`
   - Your WordPress site still works at: `https://tometintico.com`

### Alternative: Use a different port for the app

If you want to keep things completely separate, run the app on a different port and proxy to that:

```nginx
location /app {
    proxy_pass http://localhost:8080;  # Your app runs on port 8080
    # ... rest of proxy config ...
}
```

---

## 🔒 Security Considerations

### 1. CORS Configuration
Update `server/index.ts` to restrict CORS to your domain:

```typescript
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://tometintico.com',
    'https://app.tometintico.com',
    'http://localhost:3000' // for local dev
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  // ... rest of CORS config
});
```

### 2. Session Security
Ensure your `.env` has a strong `SESSION_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Database Security
- Keep your `DATABASE_URL` secret
- Use Supabase connection pooling
- Enable Supabase's IP restrictions if needed

---

## ✅ Testing Checklist

After deployment:

- [ ] App loads at your chosen URL
- [ ] Login works (admin/admin123)
- [ ] Can add customers
- [ ] Can earn/redeem points
- [ ] Database connections work
- [ ] HTTPS is working (if using subdomain)
- [ ] WordPress site still works normally
- [ ] No WordPress files were modified

---

## 🗑️ Removing the App Later

**If using subdomain:**
- Delete DNS record
- Stop/delete Railway project (or stop PM2 process)
- Done!

**If using subdirectory:**
- Remove Nginx location block
- Reload Nginx
- Stop the app
- Done!

---

## 🆘 Troubleshooting

**"502 Bad Gateway"**
- Check if your app is running: `pm2 list` or check Railway logs
- Verify the port in Nginx config matches your app port
- Check firewall rules

**"DNS not resolving"**
- Wait longer for DNS propagation (can take up to 24 hours)
- Check DNS record is correct
- Use `dig` or `nslookup` to verify

**"WordPress broken"**
- You shouldn't have touched WordPress files
- If using subdirectory, check Nginx config syntax
- Restore from backup if needed

**"CORS errors"**
- Update CORS configuration in `server/index.ts`
- Add your domain to allowed origins

---

## 📝 Quick Reference

**Current Setup:**
- Local dev: http://localhost:3000
- Database: Supabase (already configured)
- Vendor account: admin/admin123

**Recommended Deployment:**
1. Deploy to Railway
2. Add CNAME DNS record: `app` → Railway URL
3. Wait for DNS + SSL
4. Access at: `https://app.tometintico.com`

**No WordPress files will be modified!** ✅

