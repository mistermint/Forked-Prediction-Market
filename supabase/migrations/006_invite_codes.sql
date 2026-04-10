-- Creator invite codes
create table if not exists public.creator_invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  created_by uuid not null references public.profiles(id),
  redeemed_by uuid references public.profiles(id),
  redeemed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.creator_invite_codes enable row level security;

-- Admins can do everything with codes
create policy "Admins manage invite codes"
  on public.creator_invite_codes for all
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Authenticated users can read codes (to attempt redemption)
create policy "Authenticated users can read codes"
  on public.creator_invite_codes for select
  to authenticated
  using (true);

-- Daily claim column
alter table public.profiles add column if not exists last_daily_claim timestamptz;

-- Atomic coin transfer function
create or replace function public.transfer_coins(
  sender_id uuid,
  recipient_username text,
  amount integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_id uuid;
  sender_balance integer;
  sender_username text;
begin
  if amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  select id, username into recipient_id, sender_username
  from public.profiles where id = sender_id;

  if sender_username is null then
    raise exception 'Sender not found';
  end if;

  select id into recipient_id
  from public.profiles where username = recipient_username;

  if recipient_id is null then
    raise exception 'User not found';
  end if;

  if recipient_id = sender_id then
    raise exception 'Cannot send coins to yourself';
  end if;

  -- Lock sender row and check balance
  select play_balance into sender_balance
  from public.profiles where id = sender_id for update;

  if sender_balance < amount then
    raise exception 'Insufficient balance';
  end if;

  -- Deduct from sender
  update public.profiles
  set play_balance = play_balance - amount
  where id = sender_id;

  -- Add to recipient
  update public.profiles
  set play_balance = play_balance + amount
  where id = recipient_id;

  -- Activity for sender
  insert into public.activity (user_id, type, metadata)
  values (
    sender_id,
    'payout',
    jsonb_build_object(
      'market_title', 'Sent to @' || recipient_username,
      'payout', -amount
    )
  );

  -- Activity for recipient
  insert into public.activity (user_id, type, metadata)
  values (
    recipient_id,
    'payout',
    jsonb_build_object(
      'market_title', 'Received from @' || sender_username,
      'payout', amount
    )
  );
end;
$$;
