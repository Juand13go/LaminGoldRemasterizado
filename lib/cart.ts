import "server-only";
import { cookies } from "next/headers";
import { encodeCart, decodeCart, type CartItem } from "@/lib/cart-codec";

export type { CartItem };

const COOKIE_NAME = "lg_cart";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days, guest-friendly (no login required)

function secret(): string {
  const value = process.env.CART_COOKIE_SECRET;
  if (!value) {
    throw new Error("CART_COOKIE_SECRET is not set");
  }
  return value;
}

export async function getCart(): Promise<CartItem[]> {
  const store = await cookies();
  return decodeCart(store.get(COOKIE_NAME)?.value, secret());
}

export async function getCartItemCount(): Promise<number> {
  const items = await getCart();
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

async function saveCart(items: CartItem[]): Promise<void> {
  const store = await cookies();
  const cleaned = items.filter((item) => item.quantity > 0);

  if (cleaned.length === 0) {
    store.delete(COOKIE_NAME);
    return;
  }

  store.set(COOKIE_NAME, encodeCart(cleaned, secret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function addToCart(productId: string, quantity = 1): Promise<void> {
  const items = await getCart();
  const existing = items.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ productId, quantity });
  }

  await saveCart(items);
}

export async function setQuantity(productId: string, quantity: number): Promise<void> {
  const items = await getCart();
  const next = items.filter((item) => item.productId !== productId);

  if (quantity > 0) {
    next.push({ productId, quantity });
  }

  await saveCart(next);
}

export async function incrementQuantity(productId: string, delta: number): Promise<void> {
  const items = await getCart();
  const existing = items.find((item) => item.productId === productId);
  if (!existing) return;

  existing.quantity += delta;
  await saveCart(items.filter((item) => item.quantity > 0));
}

export async function removeFromCart(productId: string): Promise<void> {
  const items = await getCart();
  await saveCart(items.filter((item) => item.productId !== productId));
}

export async function clearCart(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
