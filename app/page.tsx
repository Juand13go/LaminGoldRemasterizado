import Link from "next/link";
import Image from "next/image";
import { getCategories, getProductsByCategoryId } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export default async function HomePage() {
  const categories = await getCategories();

  const productsByCategory = await Promise.all(
    categories.map(async (category) => ({
      category,
      products: (await getProductsByCategoryId(category.id)).slice(0, 6),
    }))
  );

  return (
    <section className="container main">
      <div className="summary-box" style={{ padding: 22, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr .85fr",
            gap: 18,
            alignItems: "center",
          }}
        >
          <div>
            <div className="badge" style={{ width: "max-content" }}>
              Oro laminado premium
            </div>
            <h1 className="page-title" style={{ margin: "10px 0 8px", lineHeight: 1.05 }}>
              Lamin Gold
            </h1>
            <p className="page-subtitle" style={{ maxWidth: 520, margin: "0 0 14px" }}>
              Joyeria elegante, resistente y lista para regalo. Compra por categoria o explora
              el catalogo completo.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="btn" href="/catalogo" style={{ padding: "12px 16px" }}>
                Ver catalogo
              </Link>
              {categories[0] && (
                <Link
                  className="btn-outline"
                  href={`/categoria/${categories[0].slug}`}
                  style={{ padding: "12px 16px" }}
                >
                  Ver {categories[0].label.toLowerCase()}
                </Link>
              )}
            </div>

            <div
              className="muted"
              style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}
            >
              <span>&bull; Envios rapidos</span>
              <span>&bull; Pagas por WhatsApp</span>
              <span>&bull; Calidad premium</span>
            </div>
          </div>

          <div className="card-media" style={{ borderRadius: 18, height: 210, position: "relative" }}>
            <Image
              src="/img/foto_home.avif"
              alt="Lamin Gold"
              fill
              className="card-img"
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Comprar por categoria</div>
            <div className="muted">Elige rapido lo que buscas.</div>
          </div>
          <Link className="btn-outline" href="/catalogo">
            Ver todo
          </Link>
        </div>

        <div className="grid" style={{ marginTop: 12, gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categoria/${category.slug}`}
              className="card"
              style={{ textDecoration: "none" }}
            >
              <div className="card-body">
                <div className="badge">Categoria</div>
                <div style={{ fontWeight: 900, fontSize: 18, marginTop: 6 }}>{category.label}</div>
                <div className="muted" style={{ marginTop: 6 }}>
                  {category.description}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span className="muted">Explorar</span>
                  <span style={{ fontWeight: 900 }}>&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {productsByCategory.map(({ category, products }) => (
        <div key={category.id} style={{ marginTop: 26 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 22 }}>{category.label}</h2>
              <div className="muted">Destacados de esta categoria.</div>
            </div>
            <Link className="btn-outline" href={`/categoria/${category.slug}`}>
              Ver mas
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid" style={{ marginTop: 12 }}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="summary-box" style={{ marginTop: 12 }}>
              <strong>Aun no hay productos en {category.label}.</strong>
              <div className="muted" style={{ marginTop: 6 }}>
                Agrega productos desde el panel de admin.
              </div>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
