create table if not exists public.doctor_match_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symptoms text not null,
  pattern text not null default '',
  specialist text not null default '',
  created_at timestamp with time zone not null default now()
);

create index if not exists doctor_match_history_user_id_created_at_idx
  on public.doctor_match_history (user_id, created_at desc);

alter table public.doctor_match_history enable row level security;

drop policy if exists "Users can insert own doctor match history" on public.doctor_match_history;
drop policy if exists "Users can view own doctor match history" on public.doctor_match_history;

create policy "Users can insert own doctor match history"
on public.doctor_match_history
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view own doctor match history"
on public.doctor_match_history
for select
to authenticated
using (auth.uid() = user_id);

grant select, insert on table public.doctor_match_history to authenticated;
