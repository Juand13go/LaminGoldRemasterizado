import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { PasswordField } from "@/components/PasswordField";

export const metadata = { title: "Registro - Lamin Gold" };

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const { next } = await searchParams;

  return (
    <section className="container main">
      <h1 className="page-title">Crear cuenta</h1>
      <p className="page-subtitle">Completa tus datos para comprar mas rapido.</p>

      <div className="summary-box auth-card">
        <form action={registerAction}>
          <input type="hidden" name="next" value={next ?? ""} />
          <div className="auth-grid">
            <div className="auth-field">
              <label>Nombre completo</label>
              <input className="auth-input" name="full_name" type="text" required />
            </div>

            <div className="auth-field">
              <label>Email</label>
              <input className="auth-input" name="email" type="email" required />
            </div>

            <div className="auth-field">
              <label>WhatsApp / Celular</label>
              <input className="auth-input" name="phone" type="text" required />
            </div>

            <div className="auth-field">
              <label>Ciudad</label>
              <input className="auth-input" name="city" type="text" required />
            </div>

            <div className="auth-field">
              <label>Direccion</label>
              <input className="auth-input" name="address" type="text" required />
            </div>

            <div className="auth-field">
              <label>Contrasena</label>
              <PasswordField id="regPass1" name="password" required minLength={6} />
            </div>

            <div className="auth-field">
              <label>Confirmar contrasena</label>
              <PasswordField id="regPass2" name="password2" required minLength={6} />
            </div>

            <button className="btn" type="submit" style={{ marginTop: 6 }}>
              Crear cuenta
            </button>
            <Link className="btn-outline" href="/login" style={{ textAlign: "center" }}>
              Ya tengo cuenta
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
}
