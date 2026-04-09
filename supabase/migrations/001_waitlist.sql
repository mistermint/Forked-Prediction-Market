-- Waitlist table for pre-launch email capture
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- Only allow inserts from anonymous users (no reads, no updates, no deletes)
alter table public.waitlist enable row level security;

create policy "Anyone can join the waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);
