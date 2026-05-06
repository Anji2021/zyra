-- =============================================================================
-- Extend saved_specialists (nullable bookmark fields)
-- Run once in Supabase SQL editor if this migration was never applied locally.
--
-- Exact SQL (copy/paste friendly):
--
-- alter table public.saved_specialists add column if not exists review_count integer;
-- alter table public.saved_specialists add column if not exists maps_url text;
-- alter table public.saved_specialists add column if not exists phone text;
-- alter table public.saved_specialists add column if not exists website text;
-- alter table public.saved_specialists add column if not exists specialist_type text;
-- alter table public.saved_specialists add column if not exists search_location text;
-- =============================================================================

alter table public.saved_specialists add column if not exists review_count integer;
alter table public.saved_specialists add column if not exists maps_url text;
alter table public.saved_specialists add column if not exists phone text;
alter table public.saved_specialists add column if not exists website text;
alter table public.saved_specialists add column if not exists specialist_type text;
alter table public.saved_specialists add column if not exists search_location text;
