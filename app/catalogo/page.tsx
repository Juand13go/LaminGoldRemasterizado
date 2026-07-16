import { getActiveProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const metadata = { title: "Catálogo - Lamin Gold" };

export default async function CatalogoPage() {
  const products = await getActiveProducts();

  return (
    <section className="container">
      <h1 className="page-title">Catálogo</h1>
      <p className="page-subtitle">Accesorios de lujo en oro laminado 18k</p>

      {products.length > 0 ? (
        <div className="grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p>No hay productos disponibles.</p>
      )}
    </section>
  );
}
