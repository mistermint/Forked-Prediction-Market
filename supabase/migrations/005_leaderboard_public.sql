-- ============================================================
-- Public read access (overlay + discovery page, no auth needed)
-- ============================================================

create policy "Public can read non-draft markets"
  on public.markets for select
  to anon
  using (status in ('open', 'locked', 'settled'));

create policy "Public can read outcomes"
  on public.outcomes for select
  to anon
  using (true);

-- ============================================================
-- Leaderboard view (aggregated user stats from settled bets)
-- ============================================================

create or replace view public.leaderboard_stats as
select
  p.id                                                                   as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  count(b.id)                                                            as total_bets,
  count(b.id) filter (where b.payout > 0)                               as total_wins,
  coalesce(sum(b.payout - b.amount) filter (where b.payout is not null), 0) as net_profit,
  case
    when count(b.id) filter (where b.payout is not null) > 0
    then round(
      count(b.id) filter (where b.payout > 0)::numeric /
      count(b.id) filter (where b.payout is not null) * 100,
      1
    )
    else 0
  end                                                                    as accuracy,
  coalesce(sum(b.amount), 0)                                             as volume
from public.profiles p
left join public.bets b on b.user_id = p.id
group by p.id, p.username, p.display_name, p.avatar_url;

-- Authenticated users can query the leaderboard view
grant select on public.leaderboard_stats to authenticated;

-- ============================================================
-- Per-market leaderboard view
-- ============================================================

create or replace view public.market_leaderboard as
select
  b.market_id,
  p.id                                            as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  b.amount,
  b.payout,
  b.outcome_id,
  coalesce(b.payout - b.amount, 0)                as net_profit,
  rank() over (partition by b.market_id order by coalesce(b.payout, 0) desc) as rank
from public.bets b
join public.profiles p on p.id = b.user_id
where b.payout is not null;

grant select on public.market_leaderboard to authenticated;
