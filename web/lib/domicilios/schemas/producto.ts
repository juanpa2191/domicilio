import { z } from "zod";

/**
 * Schema para producto del Catálogo. Story 2.3 — FR-5, FR-7.
 */
export const ProductoSchema = z.object({
  nombre: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(120, "Máximo 120 caracteres")
    .trim(),
  descripcion: z
    .string()
    .max(200, "Máximo 200 caracteres")
    .nullable()
    .optional()
    .transform((v) => (v && v.trim() !== "" ? v.trim() : null)),
  precio_cop: z
    .number({ message: "Ingresa un precio en pesos" })
    .int("Solo números enteros (sin centavos)")
    .min(0, "Precio inválido")
    .max(10_000_000, "Precio inválido"),
  foto_url: z
    .string()
    .url("URL inválida")
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  disponible: z.boolean().default(true),
});

export type ProductoInput = z.infer<typeof ProductoSchema>;
