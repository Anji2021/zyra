-- If profile saves fail with permission / RLS-adjacent errors, run this after 000001.
-- Ensures the PostgREST `authenticated` role can read/write `public.profiles` (RLS still applies).

grant usage on schema public to authenticated;

grant select, insert, update on table public.profiles to authenticated;
