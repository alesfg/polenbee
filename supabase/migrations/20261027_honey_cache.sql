-- Cache for the "your likely honey" estimate (AI), keyed by a hash of the rounded pollen mix and language.
-- Only the edge function (service role) reads and writes it; RLS with no policies blocks app clients.
create table if not exists public.polenbee_honey (
  key text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.polenbee_honey enable row level security;
