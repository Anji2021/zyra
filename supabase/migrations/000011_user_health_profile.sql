-- Clarity / structured health fields live here; basic demographics stay on `public.profiles`.

create table if not exists public.user_health_profile (
  user_id uuid not null primary key references auth.users (id) on delete cascade,
  known_conditions text[] not null default '{}'::text[],
  current_concerns text[] not null default '{}'::text[],
  cycle_regularity text not null default 'unsure',
  average_cycle_length integer,
  last_period_date date,
  goals text[] not null default '{}'::text[],
  baseline_symptoms text[] not null default '{}'::text[],
  preferred_search_radius integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_health_profile_cycle_regularity_check
    check (cycle_regularity in ('regular', 'irregular', 'unsure')),
  constraint user_health_profile_radius_check
    check (preferred_search_radius in (5, 10, 25))
);

comment on table public.user_health_profile is 'Structured health / Clarity Plan fields per user; demographics on profiles.';

create index if not exists user_health_profile_user_id_idx on public.user_health_profile (user_id);

alter table public.user_health_profile enable row level security;

create policy "user_health_profile_select_own"
  on public.user_health_profile
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_health_profile_insert_own"
  on public.user_health_profile
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_health_profile_update_own"
  on public.user_health_profile
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on table public.user_health_profile to authenticated;

-- Seed from existing profiles when no row exists yet (idempotent).
insert into public.user_health_profile (
  user_id,
  cycle_regularity,
  average_cycle_length,
  last_period_date,
  goals
)
select
  p.id,
  case
    when p.cycle_regular is true then 'regular'
    when p.cycle_regular is false then 'irregular'
    else 'unsure'
  end,
  p.average_cycle_length,
  p.last_period_start,
  coalesce(p.health_goals, '{}'::text[])
from public.profiles p
where not exists (
  select 1 from public.user_health_profile u where u.user_id = p.id
);

-- Copy extended columns when present on profiles (after 000010).
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'known_conditions'
  ) then
    update public.user_health_profile uhp
    set
      known_conditions = coalesce(p.known_conditions, '{}'::text[]),
      current_concerns = coalesce(p.health_concerns, '{}'::text[]),
      baseline_symptoms = coalesce(p.symptom_baselines, '{}'::text[]),
      preferred_search_radius = coalesce(p.search_radius_miles, uhp.preferred_search_radius),
      cycle_regularity = case
        when p.cycle_regularity in ('regular', 'irregular', 'unsure') then p.cycle_regularity
        else uhp.cycle_regularity
      end
    from public.profiles p
    where p.id = uhp.user_id;
  end if;
end $$;
