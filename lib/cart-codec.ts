import { createHmac, timingSafeEqual } from "node:crypto";

export interface CartItem {
  productId: string;
  quantity: number;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function encodeCart(items: CartItem[], secret: string): string {
  const payload = Buffer.from(JSON.stringify(items), "utf8").toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

// Returns [] on any missing/malformed/tampered cookie instead of throwing, since a bad
// guest cart cookie should just look empty, not break the page.
export function decodeCart(cookieValue: string | undefined, secret: string): CartItem[] {
  if (!cookieValue) return [];

  const [payload, signature] = cookieValue.split(".");
  if (!payload || !signature) return [];

  const expected = sign(payload, secret);
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return [];

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        typeof item?.productId === "string" && Number.isInteger(item?.quantity)
    );
  } catch {
    return [];
  }
}
