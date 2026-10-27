-- Daily usage counters for the AI edge functions (per hashed IP and global caps).
-- Only the edge functions (service role) can touch them.
create table if not exists public.polenbee_rate_limits (
  bucket text not null,
  day date not null default current_date,
  count integer not null default 0,
  primary key (bucket, day)
);

alter table public.polenbee_rate_limits enable row level security;

-- Atomically counts one use of `p_bucket` today; returns false once `p_limit` is exceeded.
create or replace function public.polenbee_take_quota(p_bucket text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  used integer;
begin
  insert into public.polenbee_rate_limits as r (bucket, day, count)
  values (p_bucket, current_date, 1)
  on conflict (bucket, day) do update set count = r.count + 1
  returning r.count into used;
  return used <= p_limit;
end;
$$;

revoke execute on function public.polenbee_take_quota(text, integer) from public, anon, authenticated;
grant execute on function public.polenbee_take_quota(text, integer) to service_role;
