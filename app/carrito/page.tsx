import Link from "next/link";
import { getCartView } from "@/lib/cart-view";
import { formatCOP } from "@/lib/format";
import { updateQuantityAction, removeFromCartAction, clearCartAction } from "@/app/actions/cart";

export const metadata = { title: "Carrito | Lamin Gold" };

export default async function CartPage() {
  const { items, itemsCount, subtotal } = await getCartView();

  return (
    <>
      <section className="hero">
        <h1>Carrito</h1>
        <p className="muted">Revisa tus productos antes de confirmar.</p>
      </section>

      {items.length > 0 ? (
        <div className="cart">
          <div className="cart__items">
            {items.map((item) => (
              <div className="cart__item" key={item.productId}>
                <div className="cart__img">
                  {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnail, may be a Supabase Storage URL or an external placeholder */}
                  <img
                    src={item.imageUrl || "https://via.placeholder.com/120x120?text=LG"}
                    alt={item.name}
                  />
                </div>

                <div className="cart__info">
                  <div className="cart__name">{item.name}</div>
                  <div className="muted">$ {formatCOP(item.unitPrice)}</div>
                </div>

                <div className="cart__qty">
                  <form action={updateQuantityAction}>
                    <input type="hidden" name="product_id" value={item.productId} />
                    <input type="hidden" name="action" value="minus" />
                    <button className="btn btn--ghost" type="submit">
                      -
                    </button>
                  </form>

                  <div className="cart__qtynum">{item.quantity}</div>

                  <form action={updateQuantityAction}>
                    <input type="hidden" name="product_id" value={item.productId} />
                    <input type="hidden" name="action" value="plus" />
                    <button className="btn btn--ghost" type="submit">
                      +
                    </button>
                  </form>
                </div>

                <div className="cart__subtotal">$ {formatCOP(item.subtotal)}</div>

                <div className="cart__remove">
                  <form action={removeFromCartAction}>
                    <input type="hidden" name="product_id" value={item.productId} />
                    <button className="btn btn--danger" type="submit">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          <div className="cart__summary">
            <div className="summary">
              <div className="summary__row">
                <span className="muted">Items</span>
                <strong>{itemsCount}</strong>
              </div>
              <div className="summary__row">
                <span className="muted">Total</span>
                <strong>$ {formatCOP(subtotal)}</strong>
              </div>

              <div className="summary__actions">
                <form action={clearCartAction}>
                  <button className="btn btn--ghost" type="submit">
                    Vaciar carrito
                  </button>
                </form>
                <Link className="btn" href="/checkout">
                  Ir a checkout
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty container" style={{ padding: "20px 0" }}>
          <p className="muted">Tu carrito esta vacio.</p>
          <Link className="btn" href="/catalogo">
            Ir al catalogo
          </Link>
        </div>
      )}
    </>
  );
}
