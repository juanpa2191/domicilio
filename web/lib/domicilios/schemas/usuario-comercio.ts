import { z } from "zod";

/**
 * Schema para crear un usuario adicional del Comercio (Cocina en Story 1.7).
 * Domiciliarios se manejan en Story 2.7 (FR-25) con propósito diferente.
 */
export const CrearUsuarioComercioSchema = z.object({
  nombre: z
    .string()
    .min(2, "Nombre requerido")
    .max(100, "Máximo 100 caracteres")
    .trim(),
  email: z.string().email("Email inválido").toLowerCase().trim(),
  rol: z.enum(["cocina"], {
    message: "Rol no soportado en esta vista",
  }),
});

export type CrearUsuarioComercioInput = z.infer<typeof CrearUsuarioComercioSchema>;
