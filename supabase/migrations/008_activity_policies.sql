-- ============================================================
-- Activity table: add missing INSERT policy + broaden SELECT
-- ============================================================

-- Allow authenticated users to insert their own activity records
-- (direct client inserts from API routes, e.g. market_created)
create policy "Insert own activity"
  on public.activity for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow authenticated users to read all activity
-- (market detail pages show recent bets from all participants)
-- The existing "Read own activity" policy already covers own activity;
-- this policy broadens access to market-wide activity feeds.
create policy "Read all activity"
  on public.activity for select
  to authenticated
  using (true);

-- ============================================================
-- Bets: allow reading all bets for a market
-- (needed to show outcome distribution and participant counts)
-- ============================================================

create policy "Read market bets"
  on public.bets for select
  to authenticated
  using (true);
