-- ============================================================
-- Prediction Engine: markets, outcomes, bets, activity
-- ============================================================

-- Markets
create table public.markets (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id),
  title text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'open', 'locked', 'settled', 'cancelled')),
  pool_type text not null default 'play'
    check (pool_type in ('play', 'bet')),
  total_pool integer not null default 0,
  rake_amount integer not null default 0,
  lock_at timestamptz,
  winning_outcome_id uuid, -- FK added below after outcomes table exists
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Outcomes
create table public.outcomes (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  total_wagered integer not null default 0
);

-- Add winning_outcome_id FK now that outcomes exists
alter table public.markets
  add constraint markets_winning_outcome_id_fkey
  foreign key (winning_outcome_id) references public.outcomes(id);

-- Bets (one per user per market — users commit to one outcome)
create table public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  market_id uuid not null references public.markets(id),
  outcome_id uuid not null references public.outcomes(id),
  amount integer not null check (amount > 0),
  payout integer, -- null until settled; 0 for losers
  created_at timestamptz not null default now(),
  unique (user_id, market_id)
);

-- Activity feed
create table public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  market_id uuid references public.markets(id),
  type text not null
    check (type in ('bet_placed', 'market_created', 'market_settled', 'payout')),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index activity_market_id_idx on public.activity(market_id) where market_id is not null;
create index activity_user_id_idx on public.activity(user_id);
create index bets_market_id_idx on public.bets(market_id);

-- updated_at trigger for markets
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger markets_updated_at
  before update on public.markets
  for each row execute function public.update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.markets enable row level security;
alter table public.outcomes enable row level security;
alter table public.bets enable row level security;
alter table public.activity enable row level security;

-- Markets: authenticated users read non-draft markets (+ creator sees their drafts)
create policy "Read markets"
  on public.markets for select to authenticated
  using (status != 'draft' or creator_id = auth.uid());

-- Markets: any authenticated user can create (role enforcement handled in API)
create policy "Create markets"
  on public.markets for insert to authenticated
  with check (creator_id = auth.uid());

-- Markets: only creator can update
create policy "Update own markets"
  on public.markets for update to authenticated
  using (creator_id = auth.uid());

-- Admins can update any market
create policy "Admins update any market"
  on public.markets for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Outcomes: readable by all authenticated
create policy "Read outcomes"
  on public.outcomes for select to authenticated
  using (true);

-- Outcomes: market creator can insert
create policy "Creator adds outcomes"
  on public.outcomes for insert to authenticated
  with check (
    exists (select 1 from public.markets where id = market_id and creator_id = auth.uid())
  );

-- Bets: users see their own bets
create policy "Read own bets"
  on public.bets for select to authenticated
  using (user_id = auth.uid());

-- Activity: users see their own activity
create policy "Read own activity"
  on public.activity for select to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- Realtime
-- ============================================================

alter publication supabase_realtime add table public.markets;
alter publication supabase_realtime add table public.outcomes;
alter publication supabase_realtime add table public.bets;
alter publication supabase_realtime add table public.activity;

-- ============================================================
-- RPC: place_bet (atomic — runs in a single transaction)
-- ============================================================

create or replace function public.place_bet(
  p_user_id uuid,
  p_market_id uuid,
  p_outcome_id uuid,
  p_amount integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market markets%rowtype;
  v_balance integer;
begin
  -- Lock market row to prevent races
  select * into v_market from markets where id = p_market_id for update;

  if not found then
    return json_build_object('error', 'Market not found');
  end if;

  -- Auto-lock if lock_at has passed
  if v_market.lock_at is not null and v_market.lock_at <= now() and v_market.status = 'open' then
    update markets set status = 'locked' where id = p_market_id;
    v_market.status := 'locked';
  end if;

  if v_market.status != 'open' then
    return json_build_object('error', 'This market is not accepting bets');
  end if;

  if p_amount < 10 then
    return json_build_object('error', 'Minimum bet is 10 coins');
  end if;

  -- Verify outcome belongs to this market
  if not exists (select 1 from outcomes where id = p_outcome_id and market_id = p_market_id) then
    return json_build_object('error', 'Invalid outcome');
  end if;

  -- One bet per market
  if exists (select 1 from bets where user_id = p_user_id and market_id = p_market_id) then
    return json_build_object('error', 'You have already placed a bet on this market');
  end if;

  -- Check and deduct balance
  if v_market.pool_type = 'play' then
    select play_balance into v_balance from profiles where id = p_user_id for update;
    if v_balance < p_amount then
      return json_build_object('error', 'Insufficient balance');
    end if;
    update profiles set play_balance = play_balance - p_amount where id = p_user_id;
  else
    select bet_balance into v_balance from profiles where id = p_user_id for update;
    if v_balance < p_amount then
      return json_build_object('error', 'Insufficient BET balance');
    end if;
    update profiles set bet_balance = bet_balance - p_amount where id = p_user_id;
  end if;

  -- Insert bet
  insert into bets (user_id, market_id, outcome_id, amount)
  values (p_user_id, p_market_id, p_outcome_id, p_amount);

  -- Update outcome and market totals
  update outcomes set total_wagered = total_wagered + p_amount where id = p_outcome_id;
  update markets set total_pool = total_pool + p_amount where id = p_market_id;

  -- Activity record
  insert into activity (user_id, market_id, type, metadata)
  values (
    p_user_id, p_market_id, 'bet_placed',
    jsonb_build_object(
      'market_title', v_market.title,
      'outcome_id', p_outcome_id,
      'amount', p_amount
    )
  );

  return json_build_object('success', true);
end;
$$;

-- ============================================================
-- RPC: settle_market (atomic — runs in a single transaction)
-- ============================================================

create or replace function public.settle_market(
  p_market_id uuid,
  p_winning_outcome_id uuid,
  p_caller_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market markets%rowtype;
  v_winning_total integer;
  v_winning_share numeric;
  v_rake_percent integer;
  v_rake_amount integer;
  v_net_pool integer;
  v_bet record;
  v_payout integer;
begin
  select * into v_market from markets where id = p_market_id for update;

  if not found then
    return json_build_object('error', 'Market not found');
  end if;

  -- Auth check: must be creator or admin
  if v_market.creator_id != p_caller_id then
    if not exists (select 1 from profiles where id = p_caller_id and role = 'admin') then
      return json_build_object('error', 'Not authorized');
    end if;
  end if;

  if v_market.status not in ('open', 'locked') then
    return json_build_object('error', 'Market cannot be settled in its current state');
  end if;

  -- Verify outcome belongs to this market
  if not exists (select 1 from outcomes where id = p_winning_outcome_id and market_id = p_market_id) then
    return json_build_object('error', 'Invalid winning outcome');
  end if;

  -- Edge case: no bets placed
  if v_market.total_pool = 0 then
    update markets
    set status = 'settled', winning_outcome_id = p_winning_outcome_id
    where id = p_market_id;
    return json_build_object('success', true, 'rake', 0, 'net_pool', 0);
  end if;

  -- Get winning side total
  select coalesce(sum(amount), 0) into v_winning_total
  from bets
  where market_id = p_market_id and outcome_id = p_winning_outcome_id;

  -- Edge case: no one bet on the winning side — full pool becomes rake
  if v_winning_total = 0 then
    update bets set payout = 0 where market_id = p_market_id;
    update markets
    set status = 'settled',
        winning_outcome_id = p_winning_outcome_id,
        rake_amount = v_market.total_pool
    where id = p_market_id;
    return json_build_object('success', true, 'rake', v_market.total_pool, 'net_pool', 0);
  end if;

  -- Dynamic rake based on winning side share
  v_winning_share := (v_winning_total::numeric / v_market.total_pool::numeric) * 100;

  if v_winning_share <= 50 then
    v_rake_percent := 10;
  elsif v_winning_share <= 75 then
    v_rake_percent := 7;
  elsif v_winning_share <= 89 then
    v_rake_percent := 4;
  else
    v_rake_percent := 1;
  end if;

  v_rake_amount := floor(v_market.total_pool * v_rake_percent::numeric / 100);
  v_net_pool := v_market.total_pool - v_rake_amount;

  -- Pay out winners proportionally
  for v_bet in
    select * from bets where market_id = p_market_id and outcome_id = p_winning_outcome_id
  loop
    v_payout := floor((v_bet.amount::numeric / v_winning_total::numeric) * v_net_pool);

    update bets set payout = v_payout where id = v_bet.id;

    if v_market.pool_type = 'play' then
      update profiles set play_balance = play_balance + v_payout where id = v_bet.user_id;
    else
      update profiles set bet_balance = bet_balance + v_payout where id = v_bet.user_id;
    end if;

    insert into activity (user_id, market_id, type, metadata)
    values (
      v_bet.user_id, p_market_id, 'payout',
      jsonb_build_object(
        'market_title', v_market.title,
        'payout', v_payout,
        'original_bet', v_bet.amount,
        'rake_percent', v_rake_percent
      )
    );
  end loop;

  -- Zero out losing bets
  update bets set payout = 0
  where market_id = p_market_id
    and outcome_id != p_winning_outcome_id
    and payout is null;

  -- Update market
  update markets
  set status = 'settled',
      winning_outcome_id = p_winning_outcome_id,
      rake_amount = v_rake_amount
  where id = p_market_id;

  -- Activity for creator
  insert into activity (user_id, market_id, type, metadata)
  values (
    v_market.creator_id, p_market_id, 'market_settled',
    jsonb_build_object(
      'market_title', v_market.title,
      'total_pool', v_market.total_pool,
      'rake_amount', v_rake_amount,
      'rake_percent', v_rake_percent,
      'winning_outcome_id', p_winning_outcome_id
    )
  );

  return json_build_object(
    'success', true,
    'rake', v_rake_amount,
    'net_pool', v_net_pool,
    'rake_percent', v_rake_percent
  );
end;
$$;
