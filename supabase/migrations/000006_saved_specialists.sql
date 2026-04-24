-- Bookmarked specialists (RLS: one user per row)

create table if not exists public.saved_specialists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  address text,
  place_id text,
  rating numeric,
  created_at timestamptz not null default now()
);

create unique index if not exists saved_specialists_user_place_uidx
  on public.saved_specialists (user_id, place_id)
  where place_id is not null and place_id <> '';

create index if not exists saved_specialists_user_created_idx
  on public.saved_specialists (user_id, created_at desc);

alter table public.saved_specialists enable row level security;

drop policy if exists "Users can manage their saved specialists" on public.saved_specialists;

create policy "Users can manage their saved specialists"
  on public.saved_specialists
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, delete on table public.saved_specialists to authenticated;
