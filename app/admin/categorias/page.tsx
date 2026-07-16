import Link from "next/link";
import { getCategories } from "@/lib/products";
import { createCategoryAction, deleteCategoryAction } from "@/app/actions/admin-categories";

export const metadata = { title: "Admin - Categorias" };

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

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
            Categorias
          </h1>
          <p className="page-subtitle">Organiza las categorias del catalogo.</p>
        </div>
        <Link className="btn-outline" href="/admin">
          Volver
        </Link>
      </div>

      <div className="summary-box" style={{ marginTop: 14 }}>
        <h3 style={{ margin: "0 0 12px" }}>Nueva categoria</h3>
        <form action={createCategoryAction} className="auth-grid">
          <div className="auth-field">
            <label>Slug</label>
            <input className="auth-input" name="slug" placeholder="pulseras" required />
          </div>
          <div className="auth-field">
            <label>Etiqueta</label>
            <input className="auth-input" name="label" placeholder="Pulseras" required />
          </div>
          <div className="auth-field">
            <label>Titulo</label>
            <input className="auth-input" name="title" placeholder="Pulseras en oro laminado" required />
          </div>
          <div className="auth-field">
            <label>Descripcion</label>
            <input className="auth-input" name="description" placeholder="Estilo premium para el dia a dia." />
          </div>
          <div className="auth-field">
            <label>Orden</label>
            <input className="auth-input" name="sort_order" type="number" defaultValue={0} />
          </div>
          <button className="btn" type="submit" style={{ marginTop: 6 }}>
            + Nueva categoria
          </button>
        </form>
      </div>

      <div className="cart__items" style={{ marginTop: 14 }}>
        {categories.map((category) => (
          <div
            key={category.id}
            className="cart__item"
            style={{ gridTemplateColumns: "1fr auto", alignItems: "center" }}
          >
            <div>
              <div className="cart__name">{category.label}</div>
              <div className="muted">
                /{category.slug} &middot; {category.title}
              </div>
            </div>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={category.id} />
              <button
                className="btn-outline"
                type="submit"
                style={{ borderColor: "#c0392b", color: "#c0392b" }}
              >
                Eliminar
              </button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}
