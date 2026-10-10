import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { changePasswordAction } from "@/app/actions/auth";
import { PasswordField } from "@/components/PasswordField";

export const metadata = { title: "Mi cuenta - Lamin Gold" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/cuenta");
  }

  return (
    <section className="container main">
      <h1 className="page-title">Mi cuenta</h1>
      <p className="page-subtitle">{user.email}</p>

      <div className="summary-box auth-card">
        <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>Cambiar contraseña</h2>
        <form action={changePasswordAction}>
          <div className="auth-grid">
            <div className="auth-field">
              <label htmlFor="currentPass">Contraseña actual</label>
              <PasswordField id="currentPass" name="current_password" required />
            </div>

            <div className="auth-field">
              <label htmlFor="newPass1">Nueva contraseña</label>
              <PasswordField id="newPass1" name="password" required minLength={6} />
            </div>

            <div className="auth-field">
              <label htmlFor="newPass2">Confirmar nueva contraseña</label>
              <PasswordField id="newPass2" name="password2" required minLength={6} />
            </div>

            <button className="btn" type="submit" style={{ marginTop: 6 }}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
