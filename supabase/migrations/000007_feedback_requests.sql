create table if not exists public.feedback_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  email text,
  status text default 'new',
  created_at timestamp with time zone default now()
);

alter table public.feedback_requests enable row level security;

drop policy if exists "Users can insert own feedback" on public.feedback_requests;
drop policy if exists "Users can view own feedback" on public.feedback_requests;

create policy "Users can insert own feedback"
on public.feedback_requests
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view own feedback"
on public.feedback_requests
for select
to authenticated
using (auth.uid() = user_id);

grant select, insert on table public.feedback_requests to authenticated;
