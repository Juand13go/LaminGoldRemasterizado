"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { changePasswordSchema, loginSchema, registerSchema } from "@/lib/validations/auth";
import { withFlash } from "@/lib/flash";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function loginAction(formData: FormData): Promise<void> {
  const next = (formData.get("next") as string) || "/catalogo";
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(withFlash("/login", "error", parsed.error.issues[0]?.message ?? "Datos inválidos."));
  }

  const supabase = await createClient();
  const ip = await getClientIp();
  const allowed =
    (await checkRateLimit(supabase, `login:${parsed.data.email}`, 5, 60)) &&
    (await checkRateLimit(supabase, `login-ip:${ip}`, 20, 60));

  if (!allowed) {
    redirect(
      withFlash("/login", "error", "Demasiados intentos. Espera un minuto e intenta de nuevo.")
    );
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(withFlash("/login", "error", "Email o contraseña incorrectos."));
  }

  redirect(next);
}

export async function registerAction(formData: FormData): Promise<void> {
  const next = (formData.get("next") as string) || "/catalogo";
  const parsed = registerSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    address: formData.get("address"),
    password: formData.get("password"),
    password2: formData.get("password2"),
  });

  if (!parsed.success) {
    redirect(
      withFlash("/register", "error", parsed.error.issues[0]?.message ?? "Datos inválidos.")
    );
  }

  const { full_name, email, phone, city, address, password } = parsed.data;

  const supabase = await createClient();
  const ip = await getClientIp();
  const registerAllowed =
    (await checkRateLimit(supabase, `register:${email}`, 3, 300)) &&
    (await checkRateLimit(supabase, `register-ip:${ip}`, 10, 300));

  if (!registerAllowed) {
    redirect(
      withFlash("/register", "error", "Demasiados intentos. Espera unos minutos e intenta de nuevo.")
    );
  }

  // This is a small storefront with no real signup volume, so we skip Supabase's
  // email-confirmation step entirely (createUser + email_confirm: true) rather than
  // depending on the confirmation email/redirect URLs being configured correctly —
  // an unconfirmed account otherwise leaves the user stuck unable to log in with no
  // way to know why.
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, phone, city, address },
  });

  if (createError) {
    const message =
      createError.code === "email_exists" ||
      createError.message.toLowerCase().includes("already been registered")
        ? "Este email ya está registrado."
        : "No se pudo crear la cuenta.";
    redirect(withFlash("/register", "error", message));
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    redirect(
      withFlash("/login", "success", "Cuenta creada. Ya puedes iniciar sesión.")
    );
  }

  redirect(next);
}

export async function changePasswordAction(formData: FormData): Promise<void> {
  const parsed = changePasswordSchema.safeParse({
    current_password: formData.get("current_password"),
    password: formData.get("password"),
    password2: formData.get("password2"),
  });

  if (!parsed.success) {
    redirect(
      withFlash("/cuenta", "error", parsed.error.issues[0]?.message ?? "Datos inválidos.")
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect(withFlash("/login", "error", "Debes iniciar sesión."));
  }

  const ip = await getClientIp();
  const allowed =
    (await checkRateLimit(supabase, `change-password:${user.id}`, 5, 300)) &&
    (await checkRateLimit(supabase, `change-password-ip:${ip}`, 20, 300));

  if (!allowed) {
    redirect(
      withFlash("/cuenta", "error", "Demasiados intentos. Espera unos minutos e intenta de nuevo.")
    );
  }

  // Re-verify the current password before allowing the change — a logged-in session
  // alone (e.g. a left-open browser tab) shouldn't be enough to take over the account.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  });

  if (reauthError) {
    redirect(withFlash("/cuenta", "error", "La contraseña actual no es correcta."));
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (updateError) {
    redirect(withFlash("/cuenta", "error", "No se pudo cambiar la contraseña."));
  }

  redirect(withFlash("/cuenta", "success", "Contraseña actualizada."));
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
