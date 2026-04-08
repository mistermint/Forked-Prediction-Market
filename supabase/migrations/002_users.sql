-- User profiles (extends auth.users with app-specific fields)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'streamer', 'admin')),
  -- Play money MVP: starting balance of 1000 coins on signup
  play_balance integer not null default 1000 check (play_balance >= 0),
  bet_balance integer not null default 0 check (bet_balance >= 0),
  referral_code text unique not null,
  referred_by text references public.profiles(referral_code),
  created_at timestamptz not null default now()
);

-- Row-level security
alter table public.profiles enable row level security;

-- Anyone authenticated can read any profile (needed for leaderboards, discovery)
create policy "Authenticated users can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can update their own profile (display_name, avatar_url, username only)
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Referral tracking table
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id),
  referred_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique(referred_id)
);

alter table public.referrals enable row level security;

create policy "Users can view own referrals"
  on public.referrals for select
  to authenticated
  using (auth.uid() = referrer_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ref_code text;
  base_username text;
  final_username text;
  referred_by_code text;
  referrer_profile_id uuid;
begin
  -- Generate a unique 8-char alphanumeric referral code
  loop
    ref_code := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.profiles where referral_code = ref_code);
  end loop;

  -- Derive a base username from email or Google name
  base_username := lower(
    regexp_replace(
      coalesce(new.raw_user_meta_data->>'preferred_username', split_part(new.email, '@', 1)),
      '[^a-z0-9_]', '', 'g'
    )
  );
  if length(base_username) < 3 then
    base_username := 'user';
  end if;

  -- Ensure username is unique by appending digits if needed
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    final_username := base_username || floor(random() * 9000 + 1000)::text;
  end loop;

  -- Check if a valid referral code was provided at signup
  referred_by_code := new.raw_user_meta_data->>'referred_by';

  insert into public.profiles (id, username, display_name, avatar_url, referral_code, referred_by)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'full_name', final_username),
    new.raw_user_meta_data->>'avatar_url',
    ref_code,
    case when referred_by_code is not null and exists (
      select 1 from public.profiles where referral_code = referred_by_code
    ) then referred_by_code else null end
  );

  -- Record the referral relationship
  if referred_by_code is not null then
    select id into referrer_profile_id
    from public.profiles
    where referral_code = referred_by_code;

    if referrer_profile_id is not null then
      insert into public.referrals (referrer_id, referred_id)
      values (referrer_profile_id, new.id);
    end if;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
