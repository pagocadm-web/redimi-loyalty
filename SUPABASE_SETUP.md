# How to Get Your Supabase Connection String

## Step-by-Step:

1. **Go to your Supabase project dashboard**
   - After creating your project, you'll be on the project dashboard

2. **Click on "Settings" (gear icon) in the left sidebar**

3. **Click on "Database" in the settings menu**

4. **Scroll down to "Connection string" section**

5. **You'll see several options. Click on the "URI" tab**

6. **You'll see something like:**
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```

7. **IMPORTANT:** Replace `[YOUR-PASSWORD]` with your actual database password
   - This is the password you set when creating the project
   - If you forgot it, you can reset it in Settings → Database → Database password

8. **Copy the full string** (with your password replaced)

## Example:
If Supabase shows:
```
postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

And your password is `MySecurePass123`, then your DATABASE_URL should be:
```
postgresql://postgres.abcdefghijklmnop:MySecurePass123@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

## Alternative: Direct Connection (for development)

If you want to use the direct connection (not pooled), you can also use:
- Click "Connection string" → "Session mode" tab
- This gives you a direct connection string

For development, either works fine!

## Quick Visual Guide:

```
Supabase Dashboard
  └─ Settings (⚙️)
      └─ Database
          └─ Connection string
              └─ URI tab ← Click here!
                  └─ Copy the string
                      └─ Replace [YOUR-PASSWORD]
```

