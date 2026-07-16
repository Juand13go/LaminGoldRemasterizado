import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { PasswordField } from "@/components/PasswordField";

export const metadata = { title: "Login - Lamin Gold" };

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;

  return (
    <section className="container main">
      <h1 className="page-title">Iniciar sesion</h1>
      <p className="page-subtitle">Accede para ver tu carrito y comprar mas rapido.</p>

      <div className="summary-box auth-card">
        <form action={loginAction}>
          <input type="hidden" name="next" value={next ?? ""} />
          <div className="auth-grid">
            <div className="auth-field">
              <label>Email</label>
              <input className="auth-input" name="email" type="email" required />
            </div>

            <div className="auth-field">
              <label>Contrasena</label>
              <PasswordField id="loginPass" name="password" required minLength={6} />
            </div>

            <button className="btn" type="submit" style={{ marginTop: 6 }}>
              Entrar
            </button>
            <Link className="btn-outline" href="/register" style={{ textAlign: "center" }}>
              Crear cuenta
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
