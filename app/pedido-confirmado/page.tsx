import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp";

export const metadata = { title: "Pedido confirmado - Lamin Gold" };

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function OrderConfirmedPage({ searchParams }: Props) {
  const { order: orderId } = await searchParams;
  if (!orderId) {
    notFound();
  }

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) {
    notFound();
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("product_name_snapshot, unit_price, quantity")
    .eq("order_id", orderId);

  const orderItems = items ?? [];
  const total = orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const waUrl = buildWhatsAppOrderUrl({
    orderId: order.id,
    fullName: order.full_name,
    phone: order.phone,
    city: order.city,
    address: order.address,
    notes: order.notes || undefined,
    items: orderItems.map((item) => ({
      name: item.product_name_snapshot,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
    total,
  });

  return (
    <section className="container">
      <h1 className="page-title">Pedido confirmado</h1>
      <p className="page-subtitle">Tu pedido fue generado correctamente.</p>

      <div className="summary-box">
        <div className="row">
          <span>Codigo de pedido</span>
          <strong>{order.id}</strong>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <a className="btn" href={waUrl} target="_blank" rel="noopener noreferrer">
          Enviar por WhatsApp
        </a>
        <Link className="btn-outline" href="/catalogo">
          Seguir comprando
        </Link>
      </div>
    </section>
  );
}
