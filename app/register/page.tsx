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
      <p className="page-subtitle">Completa tus datos para comprar más rápido.</p>

      <div className="summary-box auth-card">
        <form action={registerAction}>
          <input type="hidden" name="next" value={next ?? ""} />
          <div className="auth-grid">
            <div className="auth-field">
              <label htmlFor="regFullName">Nombre completo</label>
              <input className="auth-input" id="regFullName" name="full_name" type="text" required />
            </div>

            <div className="auth-field">
              <label htmlFor="regEmail">Email</label>
              <input className="auth-input" id="regEmail" name="email" type="email" required />
            </div>

            <div className="auth-field">
              <label htmlFor="regPhone">WhatsApp / Celular</label>
              <input className="auth-input" id="regPhone" name="phone" type="text" required />
            </div>

            <div className="auth-field">
              <label htmlFor="regCity">Ciudad</label>
              <input className="auth-input" id="regCity" name="city" type="text" required />
            </div>

            <div className="auth-field">
              <label htmlFor="regAddress">Dirección</label>
              <input className="auth-input" id="regAddress" name="address" type="text" required />
            </div>

            <div className="auth-field">
              <label htmlFor="regPass1">Contraseña</label>
              <PasswordField id="regPass1" name="password" required minLength={6} />
            </div>

            <div className="auth-field">
              <label htmlFor="regPass2">Confirmar contraseña</label>
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
