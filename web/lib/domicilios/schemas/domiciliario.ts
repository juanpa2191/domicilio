import { z } from "zod";

const CELULAR_REGEX = /^3\d{9}$/;

export const DomiciliarioSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100).trim(),
  celular: z
    .string()
    .regex(CELULAR_REGEX, "Celular colombiano (10 dígitos comenzando con 3)"),
  email: z
    .string()
    .email("Email inválido")
    .toLowerCase()
    .trim()
    .nullable()
    .optional()
    .or(z.literal("").transform(() => null)),
});

export type DomiciliarioInput = z.infer<typeof DomiciliarioSchema>;
