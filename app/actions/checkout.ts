"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCart, clearCart } from "@/lib/cart";
import { checkoutSchema } from "@/lib/validations/checkout";
import { withFlash } from "@/lib/flash";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function checkoutAction(formData: FormData): Promise<void> {
  const parsed = checkoutSchema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    city: formData.get("city"),
    address: formData.get("address"),
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    redirect(withFlash("/checkout", "error", parsed.error.issues[0]?.message ?? "Datos inválidos."));
  }

  const cartItems = await getCart();
  if (cartItems.length === 0) {
    redirect("/carrito");
  }

  const supabase = await createClient();
  const ip = await getClientIp();
  const allowed =
    (await checkRateLimit(supabase, `checkout:${parsed.data.email}`, 5, 300)) &&
    (await checkRateLimit(supabase, `checkout-ip:${ip}`, 15, 300));

  if (!allowed) {
    redirect(
      withFlash("/checkout", "error", "Demasiados intentos. Espera unos minutos e intenta de nuevo.")
    );
  }

  const { data: orderId, error } = await supabase.rpc("create_order", {
    p_full_name: parsed.data.full_name,
    p_phone: parsed.data.phone,
    p_email: parsed.data.email,
    p_city: parsed.data.city,
    p_address: parsed.data.address,
    p_notes: parsed.data.notes ?? "",
    p_items: cartItems.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
  });

  if (error || !orderId) {
    redirect(
      withFlash(
        "/checkout",
        "error",
        error?.message ?? "No se pudo crear el pedido. Intenta de nuevo."
      )
    );
  }

  await clearCart();
  redirect(`/pedido-confirmado?order=${orderId}`);
}
