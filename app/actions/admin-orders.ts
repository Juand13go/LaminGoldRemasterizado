"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { orderStatusSchema } from "@/lib/validations/admin";
import { withFlash } from "@/lib/flash";

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const orderId = formData.get("order_id");
  if (typeof orderId !== "string" || !orderId) return;

  const parsed = orderStatusSchema.safeParse({ status: formData.get("status") });
  if (!parsed.success) {
    redirect(withFlash(`/admin/orders/${orderId}`, "error", "Estado no permitido."));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ status: parsed.data.status })
    .eq("id", orderId);

  if (error) {
    redirect(withFlash(`/admin/orders/${orderId}`, "error", "No se pudo actualizar."));
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  redirect(withFlash(`/admin/orders/${orderId}`, "success", "Estado actualizado."));
}
