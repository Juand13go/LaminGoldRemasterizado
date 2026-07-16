import { createClient } from "@/lib/supabase/server";

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  goldType: string;
  imageUrl: string | null;
  price: number;
  category: { slug: string; label: string } | null;
}

interface VariantRow {
  price: number;
  label: string | null;
}

interface CategoryRow {
  slug: string;
  label: string;
}

interface RawProductRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  gold_type: string;
  image_url: string | null;
  product_variants: VariantRow[] | VariantRow | null;
  categories: CategoryRow[] | CategoryRow | null;
}

const PRODUCT_SELECT = "*, product_variants(price, label), categories(slug, label)";

function firstOf<T>(value: T[] | T | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function normalize(row: RawProductRow): CatalogProduct {
  const variant = firstOf(row.product_variants);
  const category = firstOf(row.categories);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    color: row.color,
    goldType: row.gold_type,
    imageUrl: row.image_url,
    price: variant?.price ?? 0,
    category: category ? { slug: category.slug, label: category.label } : null,
  };
}

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data;
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function getActiveProducts(): Promise<CatalogProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => normalize(row as unknown as RawProductRow));
}

// Admin-only view: includes inactive products too. RLS (products_public_read) already
// restricts this to admins, so a non-admin calling it would just get the active subset.
export async function getAllProductsAdmin(): Promise<CatalogProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => normalize(row as unknown as RawProductRow));
}

export async function getProductsByCategoryId(categoryId: string): Promise<CatalogProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => normalize(row as unknown as RawProductRow));
}

// No is_active filter here: RLS (products_public_read) already restricts inactive
// rows to admins only, so a buyer requesting an inactive product's id gets zero rows
// back regardless, while an admin previewing it from /admin/products still works.
export async function getProductById(id: string): Promise<CatalogProduct | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? normalize(data as unknown as RawProductRow) : null;
}
