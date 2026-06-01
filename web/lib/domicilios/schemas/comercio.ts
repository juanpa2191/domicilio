import { z } from "zod";

/**
 * Schema para crear un nuevo Comercio + invitar al Mostrador inicial.
 * Story 1.5 — FR-30.
 */
export const CrearComercioSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede tener más de 100 caracteres")
    .trim(),
  direccion: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(200, "La dirección no puede tener más de 200 caracteres")
    .trim(),
  email_mostrador: z
    .string()
    .email("Email inválido")
    .toLowerCase()
    .trim(),
  nombre_mostrador: z
    .string()
    .min(2, "Nombre del responsable requerido")
    .max(100, "El nombre no puede tener más de 100 caracteres")
    .trim(),
});

export type CrearComercioInput = z.infer<typeof CrearComercioSchema>;
