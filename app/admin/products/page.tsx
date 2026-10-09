import Link from "next/link";
import { getAllProductsAdmin } from "@/lib/products";
import { formatCOP } from "@/lib/format";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export const metadata = { title: "Admin - Productos" };

export default async function AdminProductsPage() {
  const products = await getAllProductsAdmin();

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
            Productos
          </h1>
          <p className="page-subtitle">Listado del catálogo.</p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn-outline" href="/admin">
            Volver
          </Link>
          <Link className="btn" href="/admin/products/new">
            + Nuevo producto
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="summary-box" style={{ marginTop: 14 }}>
          <strong>No hay productos cargados.</strong>
          <p className="muted" style={{ marginTop: 6 }}>
            Crea el primero desde el botón &quot;Nuevo producto&quot;.
          </p>
        </div>
      ) : (
        <div className="cart__items" style={{ marginTop: 14 }}>
          {products.map((product) => (
            <div
              key={product.id}
              className="cart__item"
              style={{ gridTemplateColumns: "110px 1fr auto", alignItems: "center" }}
            >
              <div className="cart__img">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail list */}
                <img
                  src={product.imageUrl || "https://via.placeholder.com/300x300?text=LG"}
                  alt={product.name}
                />
              </div>

              <div className="cart__info">
                <div className="cart__name">{product.name}</div>
                <div className="muted" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span>
                    <strong>Categoría:</strong> {product.category?.label ?? ""}
                  </span>
                  <span>
                    <strong>Baño:</strong> {product.goldType}
                  </span>
                  <span>
                    <strong>Color:</strong> {product.color}
                  </span>
                </div>
                {product.description && (
                  <div className="muted" style={{ marginTop: 6 }}>
                    {product.description}
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right", minWidth: 160 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>$ {formatCOP(product.price)}</div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Link className="btn-outline" href={`/producto/${product.id}`}>
                    Ver
                  </Link>
                  <DeleteProductButton id={product.id} name={product.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
