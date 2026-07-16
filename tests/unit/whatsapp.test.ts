import { describe, it, expect, beforeEach } from "vitest";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp";

describe("buildWhatsAppOrderUrl", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "573160438565";
  });

  it("builds a wa.me link with the business number", () => {
    const url = buildWhatsAppOrderUrl({
      orderId: "order-1",
      fullName: "Ana Perez",
      phone: "3001234567",
      city: "Medellin",
      address: "Calle 1 # 2-3",
      items: [{ name: "Pulsera Clasica", quantity: 2, unitPrice: 10000 }],
      total: 20000,
    });

    expect(url.startsWith("https://wa.me/573160438565?text=")).toBe(true);
  });

  it("itemizes each line and includes the total", () => {
    const url = buildWhatsAppOrderUrl({
      orderId: "order-2",
      fullName: "Ana Perez",
      phone: "3001234567",
      city: "Medellin",
      address: "Calle 1 # 2-3",
      items: [
        { name: "Pulsera", quantity: 2, unitPrice: 10000 },
        { name: "Cadena", quantity: 1, unitPrice: 25000 },
      ],
      total: 45000,
    });

    const text = decodeURIComponent(url.split("?text=")[1]);
    expect(text).toContain("Pedido: order-2");
    expect(text).toContain("- Pulsera x2 = $ 20000");
    expect(text).toContain("- Cadena x1 = $ 25000");
    expect(text).toContain("Total: $ 45000");
  });

  it("includes notes only when present", () => {
    const withNotes = buildWhatsAppOrderUrl({
      orderId: "order-3",
      fullName: "Ana",
      phone: "300",
      city: "Cali",
      address: "Calle",
      notes: "Envolver para regalo",
      items: [],
      total: 0,
    });
    expect(decodeURIComponent(withNotes.split("?text=")[1])).toContain(
      "Notas: Envolver para regalo"
    );

    const withoutNotes = buildWhatsAppOrderUrl({
      orderId: "order-4",
      fullName: "Ana",
      phone: "300",
      city: "Cali",
      address: "Calle",
      items: [],
      total: 0,
    });
    expect(decodeURIComponent(withoutNotes.split("?text=")[1])).not.toContain("Notas:");
  });

  it("throws when the business number is not configured", () => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    expect(() =>
      buildWhatsAppOrderUrl({
        orderId: "order-5",
        fullName: "Ana",
        phone: "300",
        city: "Cali",
        address: "Calle",
        items: [],
        total: 0,
      })
    ).toThrow();
  });
});
