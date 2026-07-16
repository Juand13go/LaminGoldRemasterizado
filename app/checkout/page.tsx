import { redirect } from "next/navigation";
import { getCartView } from "@/lib/cart-view";
import { formatCOP } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { checkoutAction } from "@/app/actions/checkout";

export const metadata = { title: "Checkout - Lamin Gold" };

export default async function CheckoutPage() {
  const { items, subtotal } = await getCartView();
  if (items.length === 0) {
    redirect("/carrito");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string; phone: string; city: string; address: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, city, address")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <section className="container main">
      <div className="checkout-head">
        <div>
          <h1 className="page-title">Checkout</h1>
          <p className="page-subtitle">Completa tus datos para generar el pedido.</p>
        </div>
      </div>

      <div className="checkout-wrap">
        <form className="checkout-card" action={checkoutAction}>
          <div className="checkout-grid">
            <div className="field">
              <label>Nombre completo</label>
              <input
                className="input"
                name="full_name"
                required
                autoComplete="name"
                defaultValue={profile?.full_name ?? ""}
              />
            </div>

            <div className="field">
              <label>WhatsApp / Celular</label>
              <input
                className="input"
                name="phone"
                required
                autoComplete="tel"
                defaultValue={profile?.phone ?? ""}
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                name="email"
                required
                autoComplete="email"
                defaultValue={user?.email ?? ""}
              />
            </div>

            <div className="field">
              <label>Ciudad</label>
              <input
                className="input"
                name="city"
                required
                autoComplete="address-level2"
                defaultValue={profile?.city ?? ""}
              />
            </div>

            <div className="field field-full">
              <label>Direccion</label>
              <input
                className="input"
                name="address"
                required
                autoComplete="street-address"
                defaultValue={profile?.address ?? ""}
              />
            </div>

            <div className="field field-full">
              <label>Notas (opcional)</label>
              <textarea className="input" name="notes" rows={3}></textarea>
              <div className="hint">Si quieres, deja color, talla o detalles del pedido.</div>
            </div>
          </div>

          <div className="checkout-summary">
            <div className="summary-line">
              <span>Total</span>
              <strong>$ {formatCOP(subtotal)}</strong>
            </div>
          </div>

          <button className="btn checkout-btn" type="submit">
            Confirmar pedido
          </button>

          <div className="checkout-footnote">
            Al confirmar, se genera el pedido y luego lo confirmas por WhatsApp.
          </div>
        </form>
      </div>
    </section>
  );
}
