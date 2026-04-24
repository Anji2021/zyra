-- Assistant chat messages (RLS: one user per row)

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_user_created_idx on public.messages (user_id, created_at desc);

alter table public.messages enable row level security;

drop policy if exists "Users can manage their messages" on public.messages;

create policy "Users can manage their messages"
  on public.messages
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, delete on table public.messages to authenticated;
