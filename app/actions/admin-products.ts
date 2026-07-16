"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validations/admin";
import { withFlash } from "@/lib/flash";

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createProductAction(formData: FormData): Promise<void> {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    category_id: formData.get("category_id"),
    description: formData.get("description") ?? "",
    color: formData.get("color") || "Dorado",
    gold_type: formData.get("gold_type") || "18k",
    price: formData.get("price"),
    is_active: formData.get("is_active") === "on",
  });

  if (!parsed.success) {
    redirect(
      withFlash("/admin/products/new", "error", parsed.error.issues[0]?.message ?? "Datos invalidos.")
    );
  }

  // Image is mandatory, mirroring the legacy admin form (a product created without one
  // is rolled back there too — here we just never insert until the upload succeeds).
  const imageFile = formData.get("image_file");
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    redirect(withFlash("/admin/products/new", "error", "La imagen es obligatoria."));
  }

  const supabase = await createClient();
  const slug = `${slugify(parsed.data.name)}-${Date.now().toString(36)}`;
  const storagePath = `${slug}-${imageFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, imageFile, { contentType: imageFile.type });

  if (uploadError) {
    redirect(withFlash("/admin/products/new", "error", "No se pudo subir la imagen."));
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(storagePath);

  const { error: rpcError } = await supabase.rpc("create_product_with_variant", {
    p_name: parsed.data.name,
    p_category_id: parsed.data.category_id,
    p_description: parsed.data.description ?? "",
    p_color: parsed.data.color ?? "Dorado",
    p_gold_type: parsed.data.gold_type ?? "18k",
    p_image_url: publicUrl,
    p_is_active: parsed.data.is_active,
    p_price: parsed.data.price,
    p_slug: slug,
  });

  if (rpcError) {
    await supabase.storage.from("product-images").remove([storagePath]);
    redirect(withFlash("/admin/products/new", "error", "No se pudo crear el producto."));
  }

  revalidatePath("/admin/products");
  revalidatePath("/catalogo");
  revalidatePath("/");
  redirect(withFlash("/admin/products", "success", "Producto creado con imagen."));
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    redirect(withFlash("/admin/products", "error", "No se pudo eliminar el producto."));
  }

  revalidatePath("/admin/products");
  revalidatePath("/catalogo");
  revalidatePath("/");
  redirect(withFlash("/admin/products", "success", "Producto eliminado."));
}
