import Link from "next/link";
import type { CatalogProduct } from "@/lib/products";
import { formatCOP } from "@/lib/format";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <article className="card">
      {product.imageUrl ? (
        <div className="card-media">
          {/* eslint-disable-next-line @next/next/no-img-element -- variable aspect-ratio product photos, cropped via CSS like the legacy app */}
          <img className="card-img" src={product.imageUrl} alt={product.name} />
        </div>
      ) : (
        <div className="card-media card-media--empty">
          <div style={{ opacity: 0.7, fontWeight: 900 }}>SIN FOTO</div>
        </div>
      )}

      <div className="card-body">
        <div className="badge">{product.category?.label ?? ""}</div>

        <h3 className="card-title">{product.name}</h3>

        <p className="card-desc" style={!product.description ? { opacity: 0.7 } : undefined}>
          {product.description || "Sin descripcion por ahora."}
        </p>

        <div className="card-meta">
          <span>Color: {product.color}</span>
          <span>Bano: {product.goldType}</span>
        </div>

        <div className="card-bottom">
          <strong className="price">$ {formatCOP(product.price)}</strong>
          <Link className="btn-outline" href={`/producto/${product.id}`}>
            Ver
          </Link>
        </div>

        <AddToCartButton productId={product.id} />
      </div>
    </article>
  );
}
