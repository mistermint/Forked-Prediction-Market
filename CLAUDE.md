# Forked Games — Project Handoff & Development Guide

## What Is Forked Games

Forked Games is a web platform for **streamer-based prediction markets**. Streamers create prediction pools (e.g., "Will I win this match?"), viewers place bets using play money, and winners are paid out from the pool after the outcome is settled. The platform takes a dynamic rake (percentage cut) from each pool.

The domain is **forked.gg**.

The platform is being built by a **solo developer** using **AI-assisted coding** (Claude Code in VS Code). The codebase lives in a **private GitHub repo** and may have other contributors in the future. Code should be clean, well-structured, and easy to onboard into.

---

## Tech Stack (Decided)

| Layer | Choice | Why |
|---|---|---|
| **Framework** | SvelteKit 2 + Svelte 5 | Minimal boilerplate, reactive by default, clean syntax ideal for AI-assisted coding. Less ambiguity than React/Next.js. |
| **Styling** | Tailwind CSS | Utility-first, theme configured in `tailwind.config.js`. Retro gaming design tokens already set up. |
| **Database & Auth** | Supabase (PostgreSQL) | Managed Postgres with built-in auth (email + Google SSO), realtime subscriptions, row-level security. Free tier covers MVP. |
| **Deployment** | AWS (Node adapter) | SvelteKit configured with `@sveltejs/adapter-node`. Can deploy to EC2, ECS, or Amplify. |
| **Language** | TypeScript | Strict mode enabled. Types defined in `src/lib/types/index.ts`. |

### Why Not Other Stacks

- **React/Next.js** was rejected because AI tooling produces inconsistent React code (server vs client components, hooks dependency issues, conflicting patterns between app router and pages router).
- **Pocketbase** was rejected in favor of Supabase because Pocketbase uses SQLite which has single-writer limitations — prediction markets need concurrent write support during live streams.
- **Astro** was rejected because it's optimized for content sites, not interactive apps.
- **Qwik** was rejected due to ecosystem immaturity.

---

## Design Direction

**Modern layout with strong retro gaming accents.** The UI should feel clean and professional, but with distinctive retro personality through:

- Color palette derived from the logo (olive green `#8BA446` + near-black `#1A1A1A`)
- **Display font:** "Press Start 2P" (pixel font) — used for headings, labels, game-like UI elements, NOT body text
- **Body font:** "IBM Plex Sans" — clean, modern, readable
- **Mono font:** "IBM Plex Mono" — for numbers, balances, stats
- Sharp corners (`border-radius: 2px` via `rounded-retro`)
- Retro box shadows that offset down-right (like old-school UI depth)
- Semantic accent colors: green for wins, red for losses, yellow for pending/active, blue for info
- Dark theme throughout (dark surface backgrounds, light text)

The logo features a Game Boy-style handheld console with a fork/lightning bolt on the screen, in olive green and black. The visual identity should complement this without going full 8-bit pixel art everywhere.

### Tailwind Theme

The full theme is configured in `tailwind.config.js` with custom colors (`forked.*`, `surface.*`, `accent.*`, `text.*`), font families, pixel-specific font sizes, retro shadows, and animations. Global component classes (`.btn-primary`, `.card`, `.input`, `.heading-pixel`, `.badge-*`) are defined in `src/app.css`.

---

## Project Structure

```
forked-games/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/            # Reusable primitives: buttons, inputs, badges, cards, modals
│   │   │   ├── layout/        # Nav, sidebar, app shell, mobile menu
│   │   │   ├── prediction/    # Market cards, betting UI, pool display, outcome bars
│   │   │   ├── overlay/       # OBS stream overlay components
│   │   │   └── leaderboard/   # Ranking tables, user stats rows
│   │   ├── server/            # Server-only utilities (Supabase admin client, etc.)
│   │   ├── stores/            # Svelte stores (auth state, user data, active market)
│   │   ├── types/             # TypeScript interfaces and constants
│   │   │   └── index.ts       # User, Market, Outcome, Bet, Activity, LeaderboardEntry, RakeTier
│   │   ├── utils/             # Pure functions: rake calculator, formatters, referral codes
│   │   │   └── index.ts       # calculateRake(), formatBalance(), generateReferralCode(), timeAgo()
│   │   └── supabase.ts        # Supabase client initialization
│   ├── routes/
│   │   ├── (public)/          # Landing page, how-it-works (no auth required)
│   │   ├── (auth)/            # Login, signup flows
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (app)/             # Authenticated app (shared layout with nav/sidebar)
│   │   │   ├── dashboard/     # User home: balance, active markets, recent activity
│   │   │   ├── market/        # Market detail, betting interface, creation form
│   │   │   ├── profile/       # User profile, bet history, stats
│   │   │   ├── leaderboard/   # Rankings: per-stream, global, time-filtered
│   │   │   └── admin/         # Admin panel: user management, market oversight
│   │   ├── api/               # SvelteKit API endpoints (server-side)
│   │   │   ├── auth/
│   │   │   ├── markets/
│   │   │   └── bets/
│   │   └── overlay/           # Stream overlay route (public, transparent BG, OBS-compatible)
│   ├── app.css                # Tailwind directives + global component classes
│   ├── app.html               # HTML shell
│   └── app.d.ts               # SvelteKit type augmentation (Locals, PageData)
├── static/                    # Static assets (logo, favicon)
├── tailwind.config.js         # Full retro gaming theme
├── svelte.config.js           # SvelteKit config with path aliases
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example               # PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY
└── .gitignore
```

### Path Aliases

Configured in `svelte.config.js`:

- `$components` → `src/lib/components`
- `$stores` → `src/lib/stores`
- `$utils` → `src/lib/utils`
- `$types` → `src/lib/types`

---

## Core Domain Models

All types are in `src/lib/types/index.ts`.

### User
- `id`, `email`, `username`, `display_name`, `avatar_url`
- `role`: `'user' | 'streamer' | 'admin'`
- `play_balance`: play money balance (default starting balance on signup)
- `bet_balance`: BET currency balance (database-tracked, NOT crypto — no real money in MVP)
- `referral_code`: auto-generated 8-char alphanumeric code
- `referred_by`: referral code of the user who referred them

### Market (Prediction Pool)
- `id`, `creator_id`, `title`, `description`
- `status`: `'draft' | 'open' | 'locked' | 'settled' | 'cancelled'`
- `pool_type`: `'play' | 'bet'` (for MVP, only `'play'` is active)
- `total_pool`, `rake_amount`
- `lock_at`: when betting closes
- `winning_outcome_id`: set on settlement

### Outcome
- `id`, `market_id`, `label`, `sort_order`, `total_wagered`

### Bet
- `id`, `user_id`, `market_id`, `outcome_id`, `amount`
- `payout`: null until settled

### Activity
- `type`: `'bet_placed' | 'market_created' | 'market_settled' | 'payout'`
- `metadata`: flexible JSON for event-specific data

### LeaderboardEntry
- Aggregated stats: `net_profit`, `accuracy`, `total_wins`, `total_bets`, `volume`, `rank`

---

## Dynamic Rake Model

The platform takes a percentage cut from each prediction pool when it settles. The rake is dynamic — it decreases as the winning side's share of the pool increases (rewarding contrarian bets):

| Winning Side's Share of Pool | Rake % |
|---|---|
| 0–50% | 10% |
| 51–75% | 7% |
| 76–89% | 4% |
| 90%+ | 1% |

The rake tiers are defined as a constant in `src/lib/types/index.ts` (`RAKE_TIERS`).
The calculation function is in `src/lib/utils/index.ts` (`calculateRake()`).

---

## MVP Scope (What We're Building Now)

This is the **Play Money MVP**. No real money, no crypto, no Web3 wallets. Both play money and BET are **database-tracked balances only**.

### What's IN scope for MVP:
1. Landing page with waitlist capture and Discord funnel
2. Auth: email signup/login + Google SSO via Supabase Auth
3. User profiles with play money balance and referral system
4. Dashboard shell with balance display
5. Prediction engine: market creation, outcome builder, betting flow, manual settlement, payouts
6. Activity feed
7. Stream overlay widget (OBS/browser source compatible, realtime)
8. Dynamic rake engine integrated into settlement
9. Leaderboards (per-stream, global with daily/weekly/monthly/all-time)
10. Streamer analytics dashboard
11. Public discovery page (live streamers, featured markets)
12. Basic admin panel

### What's NOT in scope for MVP:
- Real money / crypto deposits or withdrawals
- Web3 wallet integration
- BET token purchases
- Automated settlement via game APIs (League of Legends integration is a future phase)
- Mobile native apps (web only, but mobile-responsive)

---

## Development Blocks (Task Breakdown)

Each block is a group of related tasks. Each task within a block should be a focused coding session.

### Block 0 — Project Scaffolding ✅ DONE
- SvelteKit project initialized
- Tailwind configured with retro gaming theme
- Folder structure created
- Type definitions written
- Utility functions (rake calc, formatters) written
- Supabase client stub ready
- Root layout and placeholder landing page created

### Block 1 — Landing Page
1.1 — Hero section with logo, tagline, retro-styled CTA
1.2 — Waitlist email capture (Supabase table + form submission)
1.3 — "How it works" explainer section (3-step visual)
1.4 — Discord link + social proof section
1.5 — Mobile responsiveness pass + polish

### Block 2 — Auth & User System
2.1 — Supabase Auth: email signup/login pages
2.2 — Google SSO integration
2.3 — User profile table in Supabase (schema + RLS policies)
2.4 — Internal ledger: play money balance with default starting balance on signup
2.5 — Referral code generation on signup + referral tracking table
2.6 — Basic user profile page

### Block 3 — Dashboard & Admin
3.1 — App layout shell (authenticated routes: nav, sidebar, mobile menu)
3.2 — Dashboard home: balance display, active markets, recent activity
3.3 — Basic admin panel (user list, balances, manual balance adjustments)
3.4 — Role-based access control (user vs streamer vs admin route guards)

### Block 4 — Prediction Engine Core
4.1 — Database schema: markets, outcomes, bets tables in Supabase with RLS
4.2 — Market creation form (streamer-facing: question, outcomes, countdown timer)
4.3 — Market listing page (active / upcoming / resolved tabs)
4.4 — Prediction pool UI (view market, see outcome distribution, pool size)
4.5 — Betting flow: select outcome → enter wager → confirm → deduct balance
4.6 — Activity feed component (recent bets, market events via Supabase realtime)
4.7 — Manual settlement flow (streamer selects winning outcome → triggers payout)
4.8 — Payout logic: distribute pool to winners proportionally, apply rake, update balances

### Block 5 — Stream Overlay
5.1 — Overlay route at `/overlay` (transparent background, no auth, OBS-compatible)
5.2 — Live market display widget (question, outcome options, countdown timer, pool size)
5.3 — Realtime updates via Supabase subscriptions
5.4 — Streamer overlay config panel (select active market, theme options)
5.5 — Installation guide page for streamers

### Block 6 — Rake Engine
6.1 — Integrate dynamic rake calculation into settlement/payout flow
6.2 — Rake tracking: store rake amounts per market
6.3 — Admin rake analytics view (total collected, per-market breakdown)
6.4 — Pool analytics dashboard (pool growth over time, participation stats)

### Block 7 — Leaderboards
7.1 — Leaderboard data model (aggregated user stats, computed on settlement)
7.2 — Per-stream leaderboard component
7.3 — Global leaderboards with time filters (daily / weekly / monthly / all-time)
7.4 — Leaderboard UI with retro ranking design (rank badges, stat columns)

### Block 8 — Streamer Analytics & Discovery
8.1 — Streamer analytics dashboard (total volume, turnover, top bettors, pool metrics)
8.2 — Public discovery page (live streamers using Forked, featured active markets)
8.3 — "How it works" guide page (step-by-step for new users and streamers)

---

## Coding Conventions

### Svelte
- Use **Svelte 5 runes** syntax: `$state()`, `$derived()`, `$effect()`, `$props()`
- Do NOT use legacy Svelte syntax (`export let`, `$:` reactive statements, `on:click`)
- Components use `<script lang="ts">` for TypeScript
- Use `{@render children()}` for slot content (Svelte 5 snippets), not `<slot />`

### Styling
- Use Tailwind utility classes directly in markup
- Use the custom theme tokens from `tailwind.config.js` (e.g., `bg-surface`, `text-forked-green`, `shadow-retro`)
- Use the global component classes from `app.css` where appropriate (`.btn-primary`, `.card`, `.input`, `.heading-pixel`, `.badge-*`)
- Keep styles in the component — no separate CSS files unless absolutely necessary

### TypeScript
- Strict mode. No `any` types unless unavoidable.
- Import types from `$types` alias
- Import utilities from `$utils` alias

### File Naming
- Components: PascalCase (`MarketCard.svelte`, `BetSlip.svelte`)
- Routes: SvelteKit conventions (`+page.svelte`, `+layout.svelte`, `+server.ts`)
- Utilities and stores: camelCase (`index.ts`, `authStore.ts`)

### General
- Prefer small, focused components over large monolithic ones
- Keep API logic in `+server.ts` route files or `src/lib/server/`
- Validate inputs server-side, never trust the client
- Use Supabase RLS (Row Level Security) for data access control
- Write code that is readable and maintainable — favor clarity over cleverness

---

## Environment Setup

1. Clone the repo
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in Supabase credentials
4. Run `npm run dev` to start the dev server at `http://localhost:5173`

### Supabase Setup

Create a free project at [supabase.com](https://supabase.com). You'll need:
- The project URL → `PUBLIC_SUPABASE_URL`
- The anon/public key → `PUBLIC_SUPABASE_ANON_KEY`

Database tables, RLS policies, and auth configuration will be created as part of the development blocks.

---

## Key Design Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Framework | SvelteKit over Next.js | Cleaner AI-generated code, less boilerplate, fewer ambiguous patterns |
| Database | Supabase (Postgres) over Pocketbase (SQLite) | Concurrent write support needed for live prediction pools |
| Money model | Database balances only, no crypto for MVP | Simplifies MVP, validates mechanics before adding financial complexity |
| Rake model | Dynamic tiers based on winning side % | Rewards contrarian bets, prevents low-value pools from being unprofitable |
| Design | Modern + retro accents, not full pixel art | Professional and scalable while maintaining brand identity |
| Deployment target | AWS with Node adapter | Client preference, SvelteKit adapter-node is production-ready |
| Auth | Supabase Auth (email + Google SSO) | Built-in, minimal setup, handles sessions and tokens |
| Realtime | Supabase Realtime | Postgres LISTEN/NOTIFY, no additional infrastructure needed |
