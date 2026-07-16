import { z } from "zod";

export const checkoutSchema = z.object({
  full_name: z.string().trim().min(1, "El nombre completo es obligatorio."),
  phone: z.string().trim().min(1, "El WhatsApp/celular es obligatorio."),
  email: z.string().trim().min(1, "El email es obligatorio.").email("Email invalido."),
  city: z.string().trim().min(1, "La ciudad es obligatoria."),
  address: z.string().trim().min(1, "La direccion es obligatoria."),
  notes: z.string().trim().optional().default(""),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
