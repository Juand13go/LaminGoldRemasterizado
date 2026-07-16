"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { withFlash } from "@/lib/flash";

export async function loginAction(formData: FormData): Promise<void> {
  const next = (formData.get("next") as string) || "/catalogo";
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(withFlash("/login", "error", parsed.error.issues[0]?.message ?? "Datos invalidos."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(withFlash("/login", "error", "Email o contrasena incorrectos."));
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
      withFlash("/register", "error", parsed.error.issues[0]?.message ?? "Datos invalidos.")
    );
  }

  const { full_name, email, phone, city, address, password } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, phone, city, address } },
  });

  if (error) {
    const message = error.message.toLowerCase().includes("already registered")
      ? "Este email ya esta registrado."
      : "No se pudo crear la cuenta.";
    redirect(withFlash("/register", "error", message));
  }

  if (!data.session) {
    redirect(
      withFlash(
        "/login",
        "success",
        "Cuenta creada. Revisa tu email para confirmar antes de iniciar sesion."
      )
    );
  }

  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
