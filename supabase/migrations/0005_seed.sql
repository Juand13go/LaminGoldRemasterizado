-- The 4 legacy categories (routes/shop.py CATEGORIES), now real editable rows
-- instead of a hardcoded list — so the storefront isn't empty on first run and
-- the admin can rename/reorder/add categories from day one.
insert into public.categories (slug, label, title, description, sort_order) values
  ('pulseras', 'Pulseras', 'Pulseras en oro laminado', 'Estilo premium para el dia a dia.', 1),
  ('cadenas', 'Cadenas', 'Cadenas y collares', 'Piezas elegantes para cualquier ocasion.', 2),
  ('anillos', 'Anillos', 'Anillos', 'Detalles finos, brillo y presencia.', 3),
  ('aretes', 'Aretes', 'Aretes', 'Minimalistas o llamativos, tu eliges.', 4)
on conflict (slug) do nothing;
