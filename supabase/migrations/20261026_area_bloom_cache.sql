-- Cache for the "your area" bloom summary (iNaturalist + AI), keyed by ~10 km grid cell, month and language.
-- Only the edge function (service role) reads and writes it; RLS with no policies blocks app clients.
create table if not exists public.polenbee_area_bloom (
  key text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.polenbee_area_bloom enable row level security;
