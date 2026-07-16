-- Simple sliding-window rate limiter shared by login/register/checkout Server Actions.
-- Backed by Postgres (not in-memory) because Vercel serverless functions don't share
-- memory across invocations/instances, so an in-process counter would be a no-op.
create table if not exists public.rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start timestamptz not null default now()
);

-- No policies: table is unreachable via PostgREST for anon/authenticated. Only
-- check_rate_limit() (security definer) touches it.
alter table public.rate_limits enable row level security;

create or replace function public.check_rate_limit(
  p_key text,
  p_max_attempts int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update
    set count = case
        when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
          then 1
        else public.rate_limits.count + 1
      end,
      window_start = case
        when public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
          then now()
        else public.rate_limits.window_start
      end
  returning count into v_count;

  return v_count <= p_max_attempts;
end;
$$;

grant execute on function public.check_rate_limit(text, int, int) to anon, authenticated, service_role;
