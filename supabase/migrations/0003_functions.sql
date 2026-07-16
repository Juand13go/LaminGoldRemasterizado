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
