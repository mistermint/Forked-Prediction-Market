# Forked Games — Hosting Setup Guide

This guide walks you through everything needed to get Forked Games live on your own Linux server. Follow each section in order.

---

## Prerequisites

You'll need:
- A Linux server (Ubuntu 22.04 recommended) with at least 1 GB RAM
- A domain name pointed at your server (or you can set this up during the process)
- A free [Supabase](https://supabase.com) account
- SSH access to your server

---

## Step 1 — Set Up Supabase (Database & Auth)

Supabase is a hosted database service. It handles all your data, user accounts, and real-time features for free at small scale.

### 1.1 Create a Project

1. Go to [supabase.com](https://supabase.com) and sign up / log in
2. Click **New project**
3. Give it a name (e.g. `forked-games`), set a database password, and choose a region close to your users
4. Wait ~2 minutes for the project to spin up

### 1.2 Get Your API Keys

1. In your project dashboard, go to **Settings → Configuration → API Keys**
2. You need two things:
   - **Project URL** — this is `https://<your-project-ref>.supabase.co` (find it at the top of Settings → General, or derive it from your dashboard URL — e.g. if your dashboard is `supabase.com/dashboard/project/abcdef`, your URL is `https://abcdef.supabase.co`)
   - **Publishable key** — listed under "Publishable and secret API keys". If you see a tab called "Legacy anon, service_role API keys", you can use the `anon` key from there instead — either works
3. Keep these handy for Step 3

### 1.3 Run the Database Migrations

Migrations are SQL files that create all the tables and rules the app needs. You run them once, in order, using Supabase's built-in SQL editor.

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. For each file below, open the file in your code editor, copy the entire contents, paste into the SQL Editor, and click **Run**:
   - `supabase/migrations/001_waitlist.sql`
   - `supabase/migrations/002_users.sql`
   - `supabase/migrations/003_admin_policies.sql`
   - `supabase/migrations/004_prediction_engine.sql`
   - `supabase/migrations/005_leaderboard_public.sql`
3. Run them in order — each one builds on the last
4. You should see "Success. No rows returned" after each one (that's fine, it means it worked)

### 1.4 Verify Realtime Is Enabled

The migrations (step 1.3) automatically enable realtime on all required tables, so you likely don't need to do anything here. To confirm it worked:

1. Go to **Realtime** in the left sidebar of your Supabase project
2. Click the **Inspect** tab (or **Configuration** depending on your dashboard version)
3. You should see `markets`, `outcomes`, `bets`, and `activity` listed

If any are missing, you can enable them from that screen. Otherwise, move on — the migrations handled it.

### 1.5 Configure Auth — Email

Email signup is enabled by default. During early testing you may want to turn off email confirmation so you don't have to verify every test account:

1. Go to **Authentication → Configuration → Email**
2. Turn off **"Confirm email"** (you can re-enable this before going public)

### 1.6 Configure Auth — Google OAuth (Optional but Recommended)

This lets users sign in with their Google account.

**In Google Cloud Console:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Choose **Web application**
6. Under **Authorized redirect URIs**, add both:
   - `http://localhost:5173/auth/callback` (for local testing)
   - `https://yourdomain.com/auth/callback` (replace with your real domain)
7. Click Create — copy the **Client ID** and **Client Secret**

**In Supabase:**
1. Go to **Authentication → Providers → Google**
2. Toggle it **Enabled**
3. Paste in your Client ID and Client Secret
4. Save

**Set redirect URLs in Supabase:**
1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to `https://yourdomain.com`
3. Under **Additional redirect URLs**, add:
   - `http://localhost:5173/auth/callback`
   - `https://yourdomain.com/auth/callback`

---

## Step 2 — Prepare the Code on Your Server

SSH into your server and run the following commands.

### 2.1 Install Node.js

```bash
# Install Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify it worked
node --version   # should show v20.x.x
npm --version
```

### 2.2 Install Git (if not already installed)

```bash
sudo apt-get install -y git
```

### 2.3 Clone the Repository

```bash
cd /home/your-username   # or wherever you want to put the app
git clone https://github.com/mistermint/forked-prediction-market.git forked-games
cd forked-games
```

### 2.4 Switch to the Main Branch

```bash
git checkout claude/upload-dev-docs-E94tV
```

> Once the branch is merged to main, this step becomes: `git checkout main`

### 2.5 Install Dependencies

```bash
npm install
```

---

## Step 3 — Configure Environment Variables

The app needs to know which Supabase project to connect to. This is done via a `.env` file that lives on your server only (it's never committed to git).

```bash
cp .env.example .env
nano .env
```

Fill in the two values from Step 1.2:

```
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
NODE_ENV=production
```

Save and exit (`Ctrl+X`, then `Y`, then `Enter` if using nano).

---

## Step 4 — Add Your Logo and Favicon

Before building, add your brand assets:

1. Copy your logo file to `static/logo.png`
2. Copy your favicon to `static/favicon.png`

If you don't have these yet, you can skip this step and add them later — the app will still run.

### 4.1 Update the Discord Link

Open `src/routes/+page.svelte` in a text editor and replace both occurrences of `https://discord.gg/forkedgg` with your real Discord invite link.

```bash
nano src/routes/+page.svelte
# Use Ctrl+W to search for "discord.gg/forkedgg"
```

---

## Step 5 — Build the App

This compiles everything into a production-ready Node.js server:

```bash
npm run build
```

This creates a `build/` folder. The entry point is `build/index.js`.

---

## Step 6 — Run the App with PM2

PM2 is a process manager that keeps the app running and restarts it if it crashes.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the app
pm2 start build/index.js --name forked-games

# Save the process list so it survives server reboots
pm2 save

# Set PM2 to start on boot (follow the instructions it prints)
pm2 startup
```

The app is now running on **port 3000**. To verify:

```bash
pm2 status
curl http://localhost:3000
```

---

## Step 7 — Set Up nginx as a Reverse Proxy

nginx sits in front of the app and handles incoming web traffic, forwarding it to port 3000.

### 7.1 Install nginx

```bash
sudo apt-get install -y nginx
```

### 7.2 Create a Site Config

```bash
sudo nano /etc/nginx/sites-available/forked-games
```

Paste the following (replace `yourdomain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

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

Save and exit.

### 7.3 Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/forked-games /etc/nginx/sites-enabled/
sudo nginx -t        # test the config — should say "syntax is ok"
sudo systemctl reload nginx
```

Your site should now be accessible at `http://yourdomain.com` (HTTP only for now).

---

## Step 8 — Point Your Domain to the Server

In your domain registrar's DNS settings, add an **A record**:

| Type | Name | Value |
|---|---|---|
| A | `@` | Your server's public IP address |
| A | `www` | Your server's public IP address |

DNS changes can take a few minutes to a few hours to propagate. You can check with:

```bash
ping yourdomain.com
# Should resolve to your server's IP
```

---

## Step 9 — Enable HTTPS with SSL

Once your domain is pointing to your server, get a free SSL certificate:

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get and install the certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Certbot will automatically update your nginx config to handle HTTPS and redirect HTTP to HTTPS.

Your site is now live at `https://yourdomain.com`.

---

## Step 10 — Create Your Admin Account

1. Go to `https://yourdomain.com/signup` and create your account
2. In Supabase, go to **SQL Editor** and run:

```sql
UPDATE public.profiles SET role = 'admin' WHERE username = 'your-username';
```

Replace `your-username` with the username you signed up with. You now have access to the admin panel at `/admin`.

To give someone streamer access:

```sql
UPDATE public.profiles SET role = 'streamer' WHERE username = 'their-username';
```

---

## Step 11 — Final Checks

Work through this list before announcing the site:

- [ ] All 5 migrations ran without errors
- [ ] Realtime enabled on `markets`, `outcomes`, `bets`, `activity`
- [ ] Google OAuth working (test a login)
- [ ] Redirect URLs include your production domain
- [ ] Logo and favicon in `/static/`
- [ ] Discord link updated in landing page
- [ ] Admin account promoted
- [ ] Test: sign up → go to dashboard → create a market → place a bet → settle the market
- [ ] Test: stream overlay loads at `https://yourdomain.com/overlay?market=<id>`
- [ ] SSL active (padlock shows in browser)

---

## Updating the App

When new code is pushed to the repo:

```bash
cd /home/your-username/forked-games
git pull
npm install        # in case dependencies changed
npm run build
pm2 restart forked-games
```

---

## Troubleshooting

**App won't start:**
```bash
pm2 logs forked-games   # see error output
```

**nginx errors:**
```bash
sudo nginx -t                        # test config
sudo journalctl -u nginx --no-pager  # view logs
```

**Can't connect to Supabase:**
- Double-check `.env` values match what's in Supabase Settings → API
- Make sure `NODE_ENV=production` is set in `.env`

**Migrations failed:**
- Run them one at a time and check for error messages in the SQL Editor output
- Make sure you run them in order (001 → 002 → 003 → 004 → 005)
