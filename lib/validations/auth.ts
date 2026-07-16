import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().min(1, "El email es obligatorio.").email("Email invalido."),
  password: z.string().min(1, "La contrasena es obligatoria."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(1, "El nombre completo es obligatorio."),
    email: z.string().trim().min(1, "El email es obligatorio.").email("Email invalido."),
    phone: z.string().trim().min(1, "El WhatsApp/celular es obligatorio."),
    city: z.string().trim().min(1, "La ciudad es obligatoria."),
    address: z.string().trim().min(1, "La direccion es obligatoria."),
    password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres."),
    password2: z.string().min(1, "Confirma tu contrasena."),
  })
  .refine((data) => data.password === data.password2, {
    message: "Las contrasenas no coinciden.",
    path: ["password2"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
