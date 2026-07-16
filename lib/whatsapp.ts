export interface WhatsAppOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface WhatsAppOrderInfo {
  orderId: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  items: WhatsAppOrderItem[];
  total: number;
}

// Mirrors services/order_service.py's message format exactly, so the WhatsApp
// handoff reads the same to the business as it did in the legacy Flask app.
export function buildWhatsAppOrderUrl(order: WhatsAppOrderInfo): string {
  const businessNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!businessNumber) {
    throw new Error("NEXT_PUBLIC_WHATSAPP_NUMBER is not set");
  }

  const lines = [
    "Hola! Quiero confirmar este pedido en Lamin Gold:",
    `Pedido: ${order.orderId}`,
    `Nombre: ${order.fullName}`,
    `WhatsApp: ${order.phone}`,
    `Ciudad: ${order.city}`,
    `Dirección: ${order.address}`,
    "",
    "Items:",
  ];

  for (const item of order.items) {
    const lineTotal = Math.round(item.unitPrice * item.quantity);
    lines.push(`- ${item.name} x${item.quantity} = $ ${lineTotal}`);
  }

  lines.push("", `Total: $ ${Math.round(order.total)}`);

  if (order.notes) {
    lines.push(`Notas: ${order.notes}`);
  }

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${businessNumber}?text=${text}`;
}
