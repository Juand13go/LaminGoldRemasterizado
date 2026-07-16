import { z } from "zod";

export const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "El slug es obligatorio.")
    .regex(/^[a-z0-9-]+$/, "Usa solo minusculas, numeros y guiones."),
  label: z.string().trim().min(1, "La etiqueta es obligatoria."),
  title: z.string().trim().min(1, "El titulo es obligatorio."),
  description: z.string().trim().optional().default(""),
  sort_order: z.coerce.number().int().default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  category_id: z.string().uuid("Selecciona una categoria."),
  description: z.string().trim().optional().default(""),
  color: z.string().trim().min(1).optional().default("Dorado"),
  gold_type: z.string().trim().min(1).optional().default("18k"),
  price: z.coerce.number().positive("El precio debe ser mayor a 0."),
  is_active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

export const orderStatusSchema = z.object({
  status: z.enum(["nuevo", "contactado", "en_proceso", "enviado", "entregado", "cancelado"]),
});

export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
