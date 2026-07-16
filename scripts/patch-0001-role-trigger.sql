-- Patch: fix prevent_role_self_escalation() blocking service_role (auth.uid() is null
-- outside a PostgREST user session) from ever changing a profile's role. Safe to re-run.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Only an admin can change a profile role.';
  end if;
  return new;
end;
$$;
