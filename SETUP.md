# Forked Games — Launch Checklist

Everything needed to go from a fresh clone to a running deployment.

---

## 1. Local Development Setup

```bash
git clone <repo>
cd forked-games
npm install
cp .env.example .env
# Fill in .env values (see Supabase section below)
npm run dev
# → http://localhost:5173
```

---

## 2. Supabase Setup

### 2.1 Create Project
1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **anon/public key** (Settings → API)
3. Add to `.env`:
   ```
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### 2.2 Run Migrations
Run each file in the Supabase **SQL Editor** in order:

- [ ] `supabase/migrations/001_waitlist.sql`
- [ ] `supabase/migrations/002_users.sql`
- [ ] `supabase/migrations/003_admin_policies.sql`
- [ ] `supabase/migrations/004_prediction_engine.sql`

### 2.3 Configure Auth

**Email auth** is on by default. Optionally disable email confirmations during development:
Auth → Settings → Disable "Confirm email"

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback`
   - `https://forked.gg/auth/callback`
4. Copy Client ID and Secret into Supabase:
   Auth → Providers → Google → Enable → paste credentials

**Redirect URLs** (Supabase Auth → URL Configuration):
- Site URL: `https://forked.gg`
- Additional redirect URLs:
  - `http://localhost:5173/auth/callback`
  - `https://forked.gg/auth/callback`

### 2.4 Enable Realtime
Migration 004 runs `alter publication supabase_realtime add table ...` but verify in:
Database → Replication → Supabase Realtime → confirm these tables are enabled:
- [ ] `markets`
- [ ] `outcomes`
- [ ] `bets`
- [ ] `activity`

---

## 3. First Admin Account

1. Sign up at `/signup` with your account
2. Run in Supabase SQL Editor:
   ```sql
   UPDATE public.profiles SET role = 'admin' WHERE username = 'your-username';
   ```
3. You now have access to `/admin`

To make someone a streamer:
```sql
UPDATE public.profiles SET role = 'streamer' WHERE username = 'their-username';
```

---

## 4. Content & Assets

- [ ] **Logo**: Add `logo.png` (and any variants) to `/static/`
- [ ] **Favicon**: Add `favicon.png` to `/static/`
- [ ] **Discord invite**: Replace `https://discord.gg/forkedgg` in `src/routes/+page.svelte` with your real invite link

---

## 5. Production Deployment (AWS)

### 5.1 Build

```bash
npm run build
# Output: ./build/
```

### 5.2 Environment Variables on Server

Set these on your EC2/ECS/Amplify instance:
```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
NODE_ENV=production
```

### 5.3 Run the Server

```bash
node build/index.js
# Default port: 3000
# Override: PORT=8080 node build/index.js
```

Or with PM2 for process management:
```bash
npm install -g pm2
pm2 start build/index.js --name forked-games
pm2 save && pm2 startup
```

### 5.4 Reverse Proxy (nginx example)

```nginx
server {
    listen 80;
    server_name forked.gg www.forked.gg;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.5 SSL

```bash
# With Certbot (Let's Encrypt)
sudo certbot --nginx -d forked.gg -d www.forked.gg
```

Or use AWS ACM with an Application Load Balancer.

### 5.6 Domain

Point `forked.gg` DNS A record to your server's public IP (or ALB).

---

## 6. Pre-Launch Checklist

- [ ] All migrations run in Supabase
- [ ] Google OAuth configured and tested
- [ ] Redirect URLs set for production domain
- [ ] Realtime enabled on all relevant tables
- [ ] First admin account promoted
- [ ] Discord invite link replaced in landing page
- [ ] Logo and favicon added to `/static/`
- [ ] `.env` values set on production server
- [ ] Domain DNS pointed to server
- [ ] SSL certificate active
- [ ] Test signup → dashboard → place bet → settle flow end-to-end
- [ ] Test Google SSO login
- [ ] Test admin balance adjustment
- [ ] Test stream overlay at `/overlay?market=<id>`

---

## 7. Blocks Completion Status

| Block | Description | Status |
|---|---|---|
| 0 | Project scaffolding | ✅ Done |
| 1 | Landing page + waitlist | ✅ Done |
| 2 | Auth + user system | ✅ Done |
| 3 | Dashboard + admin panel | ✅ Done |
| 4 | Prediction engine core | ✅ Done |
| 5 | Stream overlay | ⬜ Pending |
| 6 | Rake engine (analytics) | ⬜ Pending |
| 7 | Leaderboards | ⬜ Pending |
| 8 | Streamer analytics + discovery | ⬜ Pending |
