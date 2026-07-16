"use server";

import { revalidatePath } from "next/cache";
import {
  addToCart,
  incrementQuantity,
  removeFromCart,
  clearCart,
} from "@/lib/cart";

function refreshCartViews() {
  revalidatePath("/carrito");
  revalidatePath("/", "layout"); // navbar cart badge is rendered in the root layout
}

export async function addToCartAction(formData: FormData): Promise<void> {
  const productId = formData.get("product_id");
  const qtyRaw = Number(formData.get("qty") ?? 1);
  if (typeof productId !== "string" || !productId) return;

  const qty = Number.isInteger(qtyRaw) && qtyRaw > 0 ? qtyRaw : 1;
  await addToCart(productId, qty);
  refreshCartViews();
}

export async function updateQuantityAction(formData: FormData): Promise<void> {
  const productId = formData.get("product_id");
  const action = formData.get("action");
  if (typeof productId !== "string" || !productId) return;

  await incrementQuantity(productId, action === "minus" ? -1 : 1);
  refreshCartViews();
}

export async function removeFromCartAction(formData: FormData): Promise<void> {
  const productId = formData.get("product_id");
  if (typeof productId !== "string" || !productId) return;

  await removeFromCart(productId);
  refreshCartViews();
}

export async function clearCartAction(): Promise<void> {
  await clearCart();
  refreshCartViews();
}
