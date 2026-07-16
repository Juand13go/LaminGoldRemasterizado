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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Sniffs the real file format from its magic bytes instead of trusting the
// client-supplied `File.type`, which is just the browser's guess from the filename/
// input `accept` hint and can be spoofed by renaming any file to end in .jpg.
function sniffImageType(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "image/png";
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
    return "image/webp";
  return null;
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
      withFlash("/admin/products/new", "error", parsed.error.issues[0]?.message ?? "Datos inválidos.")
    );
  }

  // Image is mandatory, mirroring the legacy admin form (a product created without one
  // is rolled back there too — here we just never insert until the upload succeeds).
  const imageFile = formData.get("image_file");
  if (!(imageFile instanceof File) || imageFile.size === 0) {
    redirect(withFlash("/admin/products/new", "error", "La imagen es obligatoria."));
  }

  if (imageFile.size > MAX_IMAGE_BYTES) {
    redirect(withFlash("/admin/products/new", "error", "La imagen no puede pesar más de 5MB."));
  }

  const headerBytes = new Uint8Array(await imageFile.slice(0, 12).arrayBuffer());
  const sniffedType = sniffImageType(headerBytes);
  if (!sniffedType) {
    redirect(
      withFlash("/admin/products/new", "error", "El archivo no es una imagen válida (jpg, png o webp).")
    );
  }

  const supabase = await createClient();
  const slug = `${slugify(parsed.data.name)}-${Date.now().toString(36)}`;
  const storagePath = `${slug}-${imageFile.name}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(storagePath, imageFile, { contentType: sniffedType });

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
