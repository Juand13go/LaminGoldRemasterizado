import Link from "next/link";

export const metadata = { title: "Admin - Lamin Gold" };

export default function AdminDashboardPage() {
  return (
    <section className="container main">
      <h1 className="page-title">Panel Administrador</h1>
      <p className="page-subtitle">Gestión de categorías, productos y pedidos.</p>

      <div className="cart__items">
        <div className="cart__item" style={{ gridTemplateColumns: "1fr auto" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Categorías</div>
            <div className="muted">Crear y organizar las categorías del catálogo</div>
          </div>
          <Link className="btn-outline" href="/admin/categorias">
            Gestionar
          </Link>
        </div>

        <div className="cart__item" style={{ gridTemplateColumns: "1fr auto" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Productos</div>
            <div className="muted">Crear, revisar y organizar el catálogo</div>
          </div>
          <Link className="btn-outline" href="/admin/products">
            Gestionar
          </Link>
        </div>

        <div className="cart__item" style={{ gridTemplateColumns: "1fr auto" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Pedidos</div>
            <div className="muted">Ver pedidos y hacer seguimiento</div>
          </div>
          <Link className="btn-outline" href="/admin/orders">
            Ver pedidos
          </Link>
        </div>

        <div className="cart__item" style={{ gridTemplateColumns: "1fr auto" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Volver al catálogo</div>
            <div className="muted">Ir a la tienda como cliente</div>
          </div>
          <Link className="btn-outline" href="/catalogo">
            Ir a tienda
          </Link>
        </div>
      </div>
    </section>
  );
}
