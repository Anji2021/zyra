create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index if not exists push_subscriptions_endpoint_key
  on public.push_subscriptions (endpoint);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can manage own push subscriptions" on public.push_subscriptions;

create policy "Users can manage own push subscriptions"
on public.push_subscriptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update, delete on table public.push_subscriptions to authenticated;
