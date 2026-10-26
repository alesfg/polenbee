-- Pollen analyses now carry where/when they were taken so history can be grouped by zone.
alter table public.polenbee_pollen_analyses
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists place_name text,
  add column if not exists pollen_color text,
  add column if not exists pollen_color_name text,
  add column if not exists context jsonb not null default '{}'::jsonb;

create index if not exists polenbee_pollen_analyses_user_created_idx
  on public.polenbee_pollen_analyses (user_id, created_at desc);
