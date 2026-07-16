export interface CartLineInput {
  productId: string;
  quantity: number;
}

export interface ProductLookup {
  name: string;
  imageUrl: string | null;
  isActive: boolean;
  price: number;
}

export interface CartLineItem {
  productId: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CartTotals {
  items: CartLineItem[];
  itemsCount: number;
  subtotal: number;
}

// Pure so it's easy to unit test independently of Supabase/cookies. Silently drops
// lines for products that were deleted or deactivated after being added to the cart,
// instead of crashing the cart page.
export function summarizeCart(
  lines: CartLineInput[],
  products: Map<string, ProductLookup>
): CartTotals {
  const items: CartLineItem[] = [];
  let subtotal = 0;
  let itemsCount = 0;

  for (const line of lines) {
    const product = products.get(line.productId);
    if (!product || !product.isActive) continue;

    const lineSubtotal = product.price * line.quantity;
    items.push({
      productId: line.productId,
      name: product.name,
      imageUrl: product.imageUrl,
      unitPrice: product.price,
      quantity: line.quantity,
      subtotal: lineSubtotal,
    });
    subtotal += lineSubtotal;
    itemsCount += line.quantity;
  }

  return { items, itemsCount, subtotal };
}
