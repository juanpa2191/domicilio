import { z } from "zod";

/**
 * Schema para cambio de contraseña (primer login Mostrador/Cocina, o cambio voluntario).
 */
export const CambiarPasswordSchema = z
  .object({
    nueva_password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(72, "Máximo 72 caracteres"),
    confirmar_password: z.string(),
  })
  .refine((data) => data.nueva_password === data.confirmar_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar_password"],
  });

export type CambiarPasswordInput = z.infer<typeof CambiarPasswordSchema>;
