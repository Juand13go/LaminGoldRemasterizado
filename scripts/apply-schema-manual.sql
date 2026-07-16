-- Convenience concatenation of supabase/migrations/0001_*.sql through 0005_*.sql, in
-- order, for pasting into the Supabase Dashboard SQL Editor in a single run.
-- The migration files themselves (not this file) are the source of truth going
-- forward -- regenerate this by re-concatenating them if they change.

-- ============================================================
-- 0001_schema.sql
-- ============================================================
-- Lamin Gold: core relational schema replacing the old Appwrite collections.
create extension if not exists pgcrypto;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  title text not null,
  description text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- One row per auth.users id; populated by the handle_new_user trigger (see 0003_functions.sql).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  city text not null default '',
  address text not null default '',
  role text not null default 'buyer' check (role in ('buyer', 'admin')),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  slug text unique not null,
  description text not null default '',
  color text not null default 'Dorado',
  gold_type text not null default '18k',
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Exactly one row per product today (price lives here, not on products), so
-- adding real multi-variant support later (size/color) needs no breaking migration.
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text,
  price numeric(12, 2) not null check (price >= 0),
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  full_name text not null,
  phone text not null,
  email text not null,
  city text not null,
  address text not null,
  notes text not null default '',
  status text not null default 'nuevo'
    check (status in ('nuevo', 'contactado', 'en_proceso', 'enviado', 'entregado', 'cancelado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- product_id/variant_id are nullable and ON DELETE SET NULL: historical orders must keep
-- showing their snapshot even if the product is later deleted (never re-join live product data).
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name_snapshot text not null,
  variant_label_snapshot text,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null
);

create index products_category_id_idx on public.products (category_id);
create index product_variants_product_id_idx on public.product_variants (product_id);
create index orders_user_id_idx on public.orders (user_id);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();


-- ============================================================
-- 0002_rls.sql
-- ============================================================
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

-- Prevent a buyer from granting themselves admin via a profile update. auth.uid() is
-- null for service_role/direct-SQL callers (migrations, admin bootstrap scripts) since
-- they're outside a PostgREST user session entirely — those already bypass RLS, so this
-- trigger only needs to stop an authenticated end user from escalating their own role.
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


-- ============================================================
-- 0003_functions.sql
-- ============================================================
-- auth.users -> public.profiles bootstrap. Extra checkout/register fields (full_name,
-- phone, city, address) are passed as auth metadata at signUp() time and copied here.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, city, address)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    coalesce(new.raw_user_meta_data ->> 'address', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomically creates a product + its single default variant. Runs as the calling
-- user (security invoker) so the existing products/product_variants RLS admin-write
-- policies are what actually authorize this, not the function itself.
create or replace function public.create_product_with_variant(
  p_name text,
  p_category_id uuid,
  p_description text,
  p_color text,
  p_gold_type text,
  p_image_url text,
  p_is_active boolean,
  p_price numeric,
  p_slug text
)
returns uuid
language plpgsql
as $$
declare
  v_product_id uuid;
begin
  insert into public.products (name, category_id, description, color, gold_type, image_url, is_active, slug)
  values (p_name, p_category_id, p_description, p_color, p_gold_type, p_image_url, p_is_active, p_slug)
  returning id into v_product_id;

  insert into public.product_variants (product_id, price)
  values (v_product_id, p_price);

  return v_product_id;
end;
$$;

-- Atomically creates an order + its items. Re-reads the live variant price for each
-- product_id server-side instead of trusting client-supplied prices (the legacy Flask
-- app trusted a hidden form field, which is a straightforward price-tampering bug).
create or replace function public.create_order(
  p_full_name text,
  p_phone text,
  p_email text,
  p_city text,
  p_address text,
  p_notes text,
  p_items jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity int;
  v_variant record;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cannot create an order with an empty cart.';
  end if;

  insert into public.orders (user_id, full_name, phone, email, city, address, notes)
  values (auth.uid(), p_full_name, p_phone, p_email, p_city, p_address, p_notes)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_quantity := (v_item ->> 'quantity')::int;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'Invalid quantity for product %', v_product_id;
    end if;

    select pv.id, pv.price, pv.label, p.name
      into v_variant
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
      where pv.product_id = v_product_id and p.is_active
      order by pv.created_at
      limit 1;

    if not found then
      raise exception 'Product % is no longer available.', v_product_id;
    end if;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name_snapshot,
      variant_label_snapshot, unit_price, quantity, subtotal
    ) values (
      v_order_id, v_product_id, v_variant.id, v_variant.name,
      v_variant.label, v_variant.price, v_quantity, v_variant.price * v_quantity
    );
  end loop;

  return v_order_id;
end;
$$;


-- ============================================================
-- 0004_storage.sql
-- ============================================================
-- Storage bucket for product images, replacing the old Appwrite bucket.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product_images_admin_write" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin())
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "product_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());


-- ============================================================
-- 0005_seed.sql
-- ============================================================
-- The 4 legacy categories (routes/shop.py CATEGORIES), now real editable rows
-- instead of a hardcoded list — so the storefront isn't empty on first run and
-- the admin can rename/reorder/add categories from day one.
insert into public.categories (slug, label, title, description, sort_order) values
  ('pulseras', 'Pulseras', 'Pulseras en oro laminado', 'Estilo premium para el dia a dia.', 1),
  ('cadenas', 'Cadenas', 'Cadenas y collares', 'Piezas elegantes para cualquier ocasion.', 2),
  ('anillos', 'Anillos', 'Anillos', 'Detalles finos, brillo y presencia.', 3),
  ('aretes', 'Aretes', 'Aretes', 'Minimalistas o llamativos, tu eliges.', 4)
on conflict (slug) do nothing;


