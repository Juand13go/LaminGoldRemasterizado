import { getCart } from "@/lib/cart";
import { createClient } from "@/lib/supabase/server";
import { summarizeCart, type CartTotals, type ProductLookup } from "@/lib/cart-math";

export type { CartLineItem, CartTotals as CartView } from "@/lib/cart-math";

interface VariantRow {
  price: number;
}

interface ProductLookupRow {
  id: string;
  name: string;
  image_url: string | null;
  is_active: boolean;
  product_variants: VariantRow[] | VariantRow | null;
}

// Cart cookie only stores {productId, quantity} — price/name are always re-read live here,
// so a stale cookie can never show (or checkout with) a tampered or outdated price.
export async function getCartView(): Promise<CartTotals> {
  const cartItems = await getCart();
  if (cartItems.length === 0) {
    return { items: [], itemsCount: 0, subtotal: 0 };
  }

  const supabase = await createClient();
  const ids = cartItems.map((item) => item.productId);
  const { data, error } = await supabase
    .from("products")
    .select("id, name, image_url, is_active, product_variants(price)")
    .in("id", ids);

  if (error) throw error;

  const byId = new Map<string, ProductLookup>(
    ((data ?? []) as unknown as ProductLookupRow[]).map((row) => {
      const variant = Array.isArray(row.product_variants)
        ? row.product_variants[0]
        : row.product_variants;
      return [
        row.id,
        {
          name: row.name,
          imageUrl: row.image_url,
          isActive: row.is_active,
          price: variant?.price ?? 0,
        },
      ] as const;
    })
  );

  return summarizeCart(cartItems, byId);
}
