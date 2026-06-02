import { z } from "zod";

const CELULAR_REGEX = /^3\d{9}$/;

export const CelularSchema = z.object({
  celular: z
    .string()
    .regex(CELULAR_REGEX, "Celular colombiano (10 dígitos comenzando con 3)"),
});

export type CelularInput = z.infer<typeof CelularSchema>;
