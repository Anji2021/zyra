-- Zyra: profiles table + RLS (run in Supabase SQL Editor or via CLI)
-- Requires: authenticated users from Supabase Auth

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  age integer,
  location text,
  health_goals text[] not null default '{}'::text[],
  conditions text[] not null default '{}'::text[],
  cycle_regular boolean,
  average_cycle_length integer,
  last_period_start date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Private health profile for Zyra; one row per auth user.';

create index if not exists profiles_id_idx on public.profiles (id);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
