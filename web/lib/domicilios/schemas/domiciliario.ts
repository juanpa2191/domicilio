import { z } from "zod";

const CELULAR_REGEX = /^3\d{9}$/;

export const DomiciliarioSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100).trim(),
  celular: z
    .string()
    .regex(CELULAR_REGEX, "Celular colombiano (10 dígitos comenzando con 3)"),
  email: z.string().email("Email inválido").toLowerCase().trim(),
});

export type DomiciliarioInput = z.infer<typeof DomiciliarioSchema>;

export const NuevoDomiciliarioSchema = DomiciliarioSchema.extend({
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export type NuevoDomiciliarioInput = z.infer<typeof NuevoDomiciliarioSchema>;
