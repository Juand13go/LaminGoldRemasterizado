import { describe, it, expect } from "vitest";
import { encodeCart, decodeCart, type CartItem } from "@/lib/cart-codec";

const SECRET = "test-secret-do-not-use-in-prod";

describe("cart-codec", () => {
  it("round-trips a cart through encode/decode", () => {
    const items: CartItem[] = [
      { productId: "p1", quantity: 2 },
      { productId: "p2", quantity: 1 },
    ];

    const cookie = encodeCart(items, SECRET);
    expect(decodeCart(cookie, SECRET)).toEqual(items);
  });

  it("returns an empty cart for a missing cookie", () => {
    expect(decodeCart(undefined, SECRET)).toEqual([]);
  });

  it("returns an empty cart for a malformed cookie", () => {
    expect(decodeCart("not-a-valid-cookie", SECRET)).toEqual([]);
    expect(decodeCart("", SECRET)).toEqual([]);
  });

  it("rejects a cookie whose payload was tampered with", () => {
    const cookie = encodeCart([{ productId: "p1", quantity: 1 }], SECRET);
    const [payload, signature] = cookie.split(".");

    const tamperedPayload = Buffer.from(
      JSON.stringify([{ productId: "p1", quantity: 999 }]),
      "utf8"
    ).toString("base64url");

    expect(decodeCart(`${tamperedPayload}.${signature}`, SECRET)).toEqual([]);
    expect(decodeCart(`${payload}.deadbeef`, SECRET)).toEqual([]);
  });

  it("rejects a cookie signed with a different secret", () => {
    const cookie = encodeCart([{ productId: "p1", quantity: 1 }], SECRET);
    expect(decodeCart(cookie, "a-completely-different-secret")).toEqual([]);
  });

  it("drops entries with the wrong shape instead of throwing", () => {
    const cookie = encodeCart(
      [{ productId: 5, quantity: 2 } as unknown as CartItem],
      SECRET
    );
    expect(decodeCart(cookie, SECRET)).toEqual([]);
  });

  it("drops non-integer quantities gracefully", () => {
    const cookie = encodeCart(
      [{ productId: "p1", quantity: 1.5 } as unknown as CartItem],
      SECRET
    );
    expect(decodeCart(cookie, SECRET)).toEqual([]);
  });
});
