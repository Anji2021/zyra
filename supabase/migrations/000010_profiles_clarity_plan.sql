-- Clarity Plan: structured profile extensions (safe defaults for existing rows)

alter table public.profiles
  add column if not exists known_conditions text[] not null default '{}'::text[];

alter table public.profiles
  add column if not exists health_concerns text[] not null default '{}'::text[];

alter table public.profiles
  add column if not exists symptom_baselines text[] not null default '{}'::text[];

alter table public.profiles
  add column if not exists search_radius_miles integer;

update public.profiles
set search_radius_miles = 10
where search_radius_miles is null;

alter table public.profiles
  alter column search_radius_miles set default 10;

alter table public.profiles
  alter column search_radius_miles set not null;

alter table public.profiles
  drop constraint if exists profiles_search_radius_miles_check;

alter table public.profiles
  add constraint profiles_search_radius_miles_check
  check (search_radius_miles in (5, 10, 25));

alter table public.profiles
  add column if not exists cycle_regularity text;

update public.profiles
set cycle_regularity = case
  when cycle_regular is true then 'regular'
  when cycle_regular is false then 'irregular'
  else 'unsure'
end
where cycle_regularity is null;

alter table public.profiles
  alter column cycle_regularity set default 'unsure';

update public.profiles
set cycle_regularity = coalesce(cycle_regularity, 'unsure');

alter table public.profiles
  alter column cycle_regularity set not null;

alter table public.profiles
  drop constraint if exists profiles_cycle_regularity_check;

alter table public.profiles
  add constraint profiles_cycle_regularity_check
  check (cycle_regularity in ('regular', 'irregular', 'unsure'));
