import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { checkoutSchema } from "@/lib/validations/checkout";
import { categorySchema, productSchema, orderStatusSchema } from "@/lib/validations/admin";

describe("loginSchema", () => {
  it("accepts a valid email/password pair", () => {
    const result = loginSchema.safeParse({ email: "a@example.com", password: "secret" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "secret" }).success).toBe(
      false
    );
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@example.com", password: "" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  const base = {
    full_name: "Ana Perez",
    email: "ana@example.com",
    phone: "3001234567",
    city: "Medellin",
    address: "Calle 1",
    password: "secret6",
    password2: "secret6",
  };

  it("accepts a fully valid registration", () => {
    expect(registerSchema.safeParse(base).success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({ ...base, password2: "different" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 6 characters", () => {
    expect(
      registerSchema.safeParse({ ...base, password: "abc", password2: "abc" }).success
    ).toBe(false);
  });

  it("rejects a missing required field", () => {
    expect(registerSchema.safeParse({ ...base, city: "" }).success).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const base = {
    full_name: "Ana Perez",
    phone: "3001234567",
    email: "ana@example.com",
    city: "Medellin",
    address: "Calle 1",
  };

  it("accepts valid checkout data with optional notes defaulted", () => {
    const result = checkoutSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe("");
    }
  });

  it("rejects an invalid email", () => {
    expect(checkoutSchema.safeParse({ ...base, email: "nope" }).success).toBe(false);
  });

  it("rejects a blank address", () => {
    expect(checkoutSchema.safeParse({ ...base, address: "   " }).success).toBe(false);
  });
});

describe("categorySchema", () => {
  it("accepts a valid slug", () => {
    expect(
      categorySchema.safeParse({ slug: "pulseras", label: "Pulseras", title: "Pulseras" }).success
    ).toBe(true);
  });

  it("rejects a slug with spaces or uppercase", () => {
    expect(
      categorySchema.safeParse({ slug: "Pulseras Bonitas", label: "x", title: "x" }).success
    ).toBe(false);
  });
});

describe("productSchema", () => {
  const base = {
    name: "Pulsera",
    category_id: "123e4567-e89b-12d3-a456-426614174000",
    price: 10000,
  };

  it("accepts a valid product with defaults filled in", () => {
    const result = productSchema.safeParse(base);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe("Dorado");
      expect(result.data.gold_type).toBe("18k");
      expect(result.data.is_active).toBe(true);
    }
  });

  it("rejects a non-uuid category_id", () => {
    expect(productSchema.safeParse({ ...base, category_id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects a zero or negative price", () => {
    expect(productSchema.safeParse({ ...base, price: 0 }).success).toBe(false);
    expect(productSchema.safeParse({ ...base, price: -5 }).success).toBe(false);
  });
});

describe("orderStatusSchema", () => {
  it("accepts each of the 6 legacy statuses", () => {
    for (const status of [
      "nuevo",
      "contactado",
      "en_proceso",
      "enviado",
      "entregado",
      "cancelado",
    ]) {
      expect(orderStatusSchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("rejects an unknown status", () => {
    expect(orderStatusSchema.safeParse({ status: "en_camino" }).success).toBe(false);
  });
});
