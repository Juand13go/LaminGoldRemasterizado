import Link from "next/link";
import { getCategories } from "@/lib/products";
import { createProductAction } from "@/app/actions/admin-products";

export const metadata = { title: "Admin - Nuevo Producto" };

export default async function NewProductPage() {
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
            Nuevo producto
          </h1>
          <p className="page-subtitle">Crear producto en el catalogo.</p>
        </div>
        <Link className="btn-outline" href="/admin/products">
          Volver
        </Link>
      </div>

      <div className="summary-box auth-card" style={{ marginTop: 14 }}>
        <form action={createProductAction} encType="multipart/form-data">
          <div className="auth-grid">
            <div className="auth-field">
              <label>Nombre</label>
              <input className="auth-input" name="name" type="text" required />
            </div>

            <div className="auth-field">
              <label>Precio (numero)</label>
              <input className="auth-input" name="price" type="number" min={1} step="1" required />
            </div>

            <div className="auth-field">
              <label>Categoria</label>
              <select className="input" name="category_id" required defaultValue="">
                <option value="" disabled>
                  Selecciona una categoria
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              <div className="hint">Crea categorias nuevas desde Admin &rarr; Categorias.</div>
            </div>

            <div className="auth-field">
              <label>Descripcion</label>
              <textarea className="auth-input" name="description" rows={3}></textarea>
            </div>

            <div className="auth-field">
              <label>Color</label>
              <input className="auth-input" name="color" type="text" defaultValue="Dorado" />
            </div>

            <div className="auth-field">
              <label>Tipo de oro</label>
              <input className="auth-input" name="gold_type" type="text" defaultValue="18k" />
            </div>

            <div className="auth-field">
              <label>Imagen del producto</label>
              <input className="auth-input" name="image_file" type="file" accept="image/*" required />
              <div className="muted" style={{ marginTop: 6 }}>
                Sube una imagen (jpg, png, webp).
              </div>
            </div>

            <div className="auth-field">
              <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 800 }}>
                <input type="checkbox" name="is_active" defaultChecked style={{ transform: "scale(1.1)" }} />
                Producto activo (visible en catalogo)
              </label>
              <div className="muted" style={{ marginTop: 6 }}>
                Si lo desmarcas, el producto queda guardado pero oculto del catalogo.
              </div>
            </div>

            <button className="btn" type="submit" style={{ marginTop: 6 }}>
              Crear producto
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
