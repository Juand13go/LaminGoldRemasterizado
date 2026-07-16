import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getProductsByCategoryId } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return { title: category ? `${category.title} - Lamin Gold` : "Categoria no encontrada" };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const products = await getProductsByCategoryId(category.id);

  return (
    <section className="container main">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>
            {category.title}
          </h1>
          <p className="page-subtitle">{category.description}</p>
        </div>
        <Link className="btn-outline" href="/catalogo">
          Ver catalogo
        </Link>
      </div>

      {products.length > 0 ? (
        <div className="grid" style={{ marginTop: 12 }}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p style={{ opacity: 0.75, marginTop: 16 }}>No hay productos en esta categoria por ahora.</p>
      )}
    </section>
  );
}
