import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/format";
import { updateOrderStatusAction } from "@/app/actions/admin-orders";

const STATUSES = [
  "nuevo",
  "contactado",
  "en_proceso",
  "enviado",
  "entregado",
  "cancelado",
] as const;

export const metadata = { title: "Admin - Pedido" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) {
    notFound();
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id)
    .order("created_at");

  const orderItems = items ?? [];
  const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <section className="container main">
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 className="page-title" style={{ marginBottom: 6 }}>
            Pedido {order.id}
          </h1>
          <p className="page-subtitle">Detalle del pedido y productos.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn-outline" href="/admin/orders">
            Volver
          </Link>
          <Link className="btn-outline" href="/admin">
            Panel
          </Link>
        </div>
      </div>

      <div className="cart__items" style={{ marginTop: 14 }}>
        <div className="cart__item" style={{ gridTemplateColumns: "1fr 320px", alignItems: "start" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Datos del cliente</div>
            <div className="muted" style={{ display: "grid", gap: 4 }}>
              <div>
                <strong>Nombre:</strong> {order.full_name}
              </div>
              <div>
                <strong>Email:</strong> {order.email}
              </div>
              <div>
                <strong>WhatsApp:</strong> {order.phone}
              </div>
              <div>
                <strong>Ciudad:</strong> {order.city}
              </div>
              <div>
                <strong>Dirección:</strong> {order.address}
              </div>
              {order.notes && (
                <div>
                  <strong>Notas:</strong> {order.notes}
                </div>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>Estado</div>
            <div className="muted" style={{ marginBottom: 10 }}>
              Actual: <strong>{order.status}</strong>
            </div>

            <form action={updateOrderStatusAction} className="summary-box" style={{ padding: 12 }}>
              <input type="hidden" name="order_id" value={order.id} />
              <label style={{ fontWeight: 800, display: "block", marginBottom: 6 }}>
                Cambiar estado
              </label>
              <select
                name="status"
                className="auth-input"
                defaultValue={order.status}
                style={{ marginBottom: 10 }}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <button className="btn" type="submit" style={{ width: "100%" }}>
                Guardar
              </button>
            </form>
          </div>
        </div>

        <div className="cart__item" style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Items</div>
            <div className="muted">Total items: {orderItems.length}</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Total: $ {formatCOP(total)}</div>
        </div>

        {orderItems.length === 0 ? (
          <div className="summary-box">
            <strong>Este pedido no tiene items.</strong>
          </div>
        ) : (
          orderItems.map((item) => (
            <div
              key={item.id}
              className="cart__item"
              style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}
            >
              <div>
                <div style={{ fontWeight: 900 }}>{item.product_name_snapshot}</div>
                <div className="muted">
                  Cantidad: <strong>{item.quantity}</strong>
                  {item.variant_label_snapshot && (
                    <>
                      {" "}
                      &middot; Variante: <strong>{item.variant_label_snapshot}</strong>
                    </>
                  )}
                </div>
                {item.product_id && (
                  <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                    <strong>ID Producto:</strong> {item.product_id}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="muted">Unit: $ {formatCOP(item.unit_price)}</div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>$ {formatCOP(item.subtotal)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
