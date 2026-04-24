-- Period / cycle entries (one row per logged period window)
create table if not exists public.cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists cycles_user_start_idx on public.cycles (user_id, start_date desc);

alter table public.cycles enable row level security;

create policy "Users can manage their cycles"
  on public.cycles
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on table public.cycles to authenticated;
