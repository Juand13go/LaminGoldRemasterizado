import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin - Pedidos" };

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

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
            Pedidos
          </h1>
          <p className="page-subtitle">Listado de pedidos.</p>
        </div>
        <Link className="btn-outline" href="/admin">
          Volver
        </Link>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="summary-box" style={{ marginTop: 14 }}>
          <strong>No hay pedidos todavia.</strong>
          <p className="muted" style={{ marginTop: 6 }}>
            Cuando un cliente confirme un checkout, apareceran aqui.
          </p>
        </div>
      ) : (
        <div className="cart__items" style={{ marginTop: 14 }}>
          {orders.map((order) => (
            <div
              key={order.id}
              className="cart__item"
              style={{ gridTemplateColumns: "1fr auto", alignItems: "start" }}
            >
              <div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>Pedido {order.id}</div>
                  <span
                    className="muted"
                    style={{
                      border: "1px solid rgba(212,175,55,.25)",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontWeight: 800,
                    }}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="muted" style={{ marginTop: 8, display: "grid", gap: 4 }}>
                  <div>
                    <strong>Nombre:</strong> {order.full_name}
                  </div>
                  <div>
                    <strong>WhatsApp:</strong> {order.phone}
                  </div>
                  <div>
                    <strong>Ciudad:</strong> {order.city}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 220 }}>
                <Link className="btn-outline" href={`/admin/orders/${order.id}`}>
                  Abrir
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
