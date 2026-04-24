-- Table: public.feedback_requests
--
-- Create it with InsForge MCP (connected in Cursor):
--   Tool: run-raw-sql
--   Paste the full statement below as `query` (single statement is fine).
--
-- Or run this file in the InsForge SQL editor.

create table if not exists public.feedback_requests (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'zyra_app',
  type text not null,
  title text not null,
  message text not null,
  email text,
  created_at timestamptz not null default now()
);

comment on table public.feedback_requests is 'Zyra feedback and topic requests via InsForge SDK.';
