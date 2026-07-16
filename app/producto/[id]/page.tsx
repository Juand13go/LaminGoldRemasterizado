import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/products";
import { formatCOP } from "@/lib/format";
import { addToCartAction } from "@/app/actions/cart";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  return { title: product ? `${product.name} - Lamin Gold` : "Producto - Lamin Gold" };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <section className="container main">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <Link className="btn-outline" href="/catalogo">
          Volver al catalogo
        </Link>
        <div className="badge">{product.category?.label ?? ""}</div>
      </div>

      <div className="product-wrap">
        <div className="product-media">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- variable aspect-ratio product photo, matches legacy cropping via CSS
            <img className="product-img" src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="product-img product-img--empty">
              <div style={{ opacity: 0.7, fontWeight: 900 }}>SIN FOTO</div>
            </div>
          )}
        </div>

        <div className="product-panel">
          <h1 className="page-title" style={{ margin: "0 0 8px" }}>
            {product.name}
          </h1>
          <p className="page-subtitle" style={{ marginBottom: 14 }}>
            {product.description || "Sin descripcion por ahora."}
          </p>

          <div className="product-meta">
            <div>
              <span>Color:</span> <b>{product.color}</b>
            </div>
            <div>
              <span>Bano:</span> <b>{product.goldType}</b>
            </div>
          </div>

          <div className="product-buy">
            <div className="product-price">$ {formatCOP(product.price)}</div>

            <form className="product-form" action={addToCartAction}>
              <input type="hidden" name="product_id" value={product.id} />

              <div className="qty-form" style={{ justifyContent: "flex-start" }}>
                <label style={{ fontWeight: 800 }}>Cantidad</label>
                <input className="qty" name="qty" type="number" min={1} defaultValue={1} required />
              </div>

              <button className="btn" type="submit" style={{ width: "100%", marginTop: 10 }}>
                Agregar al carrito
              </button>
            </form>
            <br />
            <Link className="btn-outline" href="/carrito" style={{ textAlign: "center", marginTop: 10 }}>
              Ir al carrito
            </Link>
          </div>

          <div className="summary-box" style={{ marginTop: 14 }}>
            <h3 style={{ margin: "0 0 10px" }}>Garantia y cuidado</h3>
            <div style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.5 }}>
              Evita agua salada, perfumes directos y golpes fuertes. Limpia con pano suave. Si
              tienes dudas, escribenos por WhatsApp y te asesoramos.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
