import { describe, it, expect } from "vitest";
import { summarizeCart, type ProductLookup } from "@/lib/cart-math";

function lookup(overrides: Partial<ProductLookup> = {}): ProductLookup {
  return {
    name: "Pulsera",
    imageUrl: null,
    isActive: true,
    price: 10000,
    ...overrides,
  };
}

describe("summarizeCart", () => {
  it("computes subtotal and item count across multiple lines", () => {
    const products = new Map([
      ["p1", lookup({ name: "Pulsera", price: 10000 })],
      ["p2", lookup({ name: "Cadena", price: 25000 })],
    ]);

    const result = summarizeCart(
      [
        { productId: "p1", quantity: 2 },
        { productId: "p2", quantity: 1 },
      ],
      products
    );

    expect(result.itemsCount).toBe(3);
    expect(result.subtotal).toBe(2 * 10000 + 25000);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ productId: "p1", unitPrice: 10000, subtotal: 20000 });
  });

  it("drops lines whose product no longer exists", () => {
    const products = new Map([["p1", lookup()]]);

    const result = summarizeCart(
      [
        { productId: "p1", quantity: 1 },
        { productId: "deleted", quantity: 5 },
      ],
      products
    );

    expect(result.items).toHaveLength(1);
    expect(result.itemsCount).toBe(1);
    expect(result.subtotal).toBe(10000);
  });

  it("drops lines whose product was deactivated", () => {
    const products = new Map([["p1", lookup({ isActive: false })]]);

    const result = summarizeCart([{ productId: "p1", quantity: 3 }], products);

    expect(result.items).toHaveLength(0);
    expect(result.itemsCount).toBe(0);
    expect(result.subtotal).toBe(0);
  });

  it("returns zeroed totals for an empty cart", () => {
    const result = summarizeCart([], new Map());
    expect(result).toEqual({ items: [], itemsCount: 0, subtotal: 0 });
  });
});
