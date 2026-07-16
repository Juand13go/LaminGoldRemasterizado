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
