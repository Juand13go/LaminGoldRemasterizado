"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validations/admin";
import { withFlash } from "@/lib/flash";

export async function createCategoryAction(formData: FormData): Promise<void> {
  const parsed = categorySchema.safeParse({
    slug: formData.get("slug"),
    label: formData.get("label"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    sort_order: formData.get("sort_order") ?? 0,
  });

  if (!parsed.success) {
    redirect(
      withFlash("/admin/categorias", "error", parsed.error.issues[0]?.message ?? "Datos invalidos.")
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert(parsed.data);

  if (error) {
    redirect(withFlash("/admin/categorias", "error", "No se pudo crear la categoria (slug duplicado?)."));
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/");
  redirect(withFlash("/admin/categorias", "success", "Categoria creada."));
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    redirect(
      withFlash(
        "/admin/categorias",
        "error",
        "No se pudo eliminar (probablemente tiene productos asociados)."
      )
    );
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/");
  redirect(withFlash("/admin/categorias", "success", "Categoria eliminada."));
}
