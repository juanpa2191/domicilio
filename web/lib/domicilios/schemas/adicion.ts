import { z } from "zod";

export const AdicionSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres").trim(),
  precio_adicional: z
    .number({ message: "Ingresa el precio adicional" })
    .int("Solo enteros")
    .min(0, "No puede ser negativo")
    .max(1_000_000, "Precio inválido"),
});

export type AdicionInput = z.infer<typeof AdicionSchema>;
