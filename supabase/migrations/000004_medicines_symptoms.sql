-- Medicines and symptoms health logs (RLS: one user per row)

create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists medicines_user_created_idx on public.medicines (user_id, created_at desc);

alter table public.medicines enable row level security;

drop policy if exists "Users can manage their medicines" on public.medicines;

create policy "Users can manage their medicines"
  on public.medicines
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.symptoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  symptom text not null,
  severity integer,
  logged_date date not null default (current_date),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists symptoms_user_logged_idx on public.symptoms (user_id, logged_date desc, created_at desc);

alter table public.symptoms enable row level security;

drop policy if exists "Users can manage their symptoms" on public.symptoms;

create policy "Users can manage their symptoms"
  on public.symptoms
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on table public.medicines to authenticated;
grant select, insert, update, delete on table public.symptoms to authenticated;
