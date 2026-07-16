-- Row Level Security: every table enforces access rules in Postgres itself,
-- not just in application code (replacing the old Flask is_admin() page guard).

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Prevent a buyer from granting themselves admin via a profile update.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_admin() then
    raise exception 'Only an admin can change a profile role.';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;

-- categories: public read, admin write
create policy "categories_public_read" on public.categories
  for select using (true);
create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- products: public read of active products, admin sees/writes everything
create policy "products_public_read" on public.products
  for select using (is_active or public.is_admin());
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- product_variants: readable when the parent product is visible, admin writes
create policy "product_variants_read" on public.product_variants
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_variants.product_id
        and (p.is_active or public.is_admin())
    )
  );
create policy "product_variants_admin_write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- profiles: a user reads/updates only their own row; admin reads all
create policy "profiles_self_or_admin_read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_self_or_admin_update" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- orders: owner or admin
create policy "orders_owner_or_admin_read" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_owner_insert" on public.orders
  for insert with check (user_id = auth.uid());
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

-- order_items: visible/insertable only through an order the caller owns (or admin)
create policy "order_items_owner_or_admin_read" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );
create policy "order_items_owner_insert" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- settings: internal config, admin only
create policy "settings_admin_only" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());
