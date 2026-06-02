import { z } from "zod";

/**
 * Configuración de formas de pago aceptadas por el Comercio.
 * Story 2.2 — FR-24.
 *
 * Se guarda en comercios.formas_pago (jsonb). El Cliente solo ve las formas
 * con activo=true en el checkout.
 */

const CELULAR_REGEX = /^3\d{9}$/; // celular colombiano: 10 dígitos comenzando con 3
const CUENTA_REGEX = /^\d{8,20}$/; // número de cuenta: 8-20 dígitos

export const FormasPagoSchema = z
  .object({
    nequi: z.object({
      activo: z.boolean(),
      celular: z.string().nullable(),
    }),
    bancolombia: z.object({
      activo: z.boolean(),
      cuenta: z.string().nullable(),
      tipo: z.enum(["ahorros", "corriente"]).nullable(),
    }),
    daviplata: z.object({
      activo: z.boolean(),
      celular: z.string().nullable(),
    }),
    efectivo_recibir: z.object({
      activo: z.boolean(),
    }),
    efectivo_local: z.object({
      activo: z.boolean(),
    }),
  })
  .superRefine((data, ctx) => {
    // Reglas condicionales: si activo=true, datos requeridos y válidos
    if (data.nequi.activo) {
      if (!data.nequi.celular?.match(CELULAR_REGEX)) {
        ctx.addIssue({
          code: "custom",
          path: ["nequi", "celular"],
          message: "Celular colombiano (10 dígitos comenzando con 3)",
        });
      }
    }
    if (data.bancolombia.activo) {
      if (!data.bancolombia.cuenta?.match(CUENTA_REGEX)) {
        ctx.addIssue({
          code: "custom",
          path: ["bancolombia", "cuenta"],
          message: "Número de cuenta (8 a 20 dígitos)",
        });
      }
      if (!data.bancolombia.tipo) {
        ctx.addIssue({
          code: "custom",
          path: ["bancolombia", "tipo"],
          message: "Selecciona tipo de cuenta",
        });
      }
    }
    if (data.daviplata.activo) {
      if (!data.daviplata.celular?.match(CELULAR_REGEX)) {
        ctx.addIssue({
          code: "custom",
          path: ["daviplata", "celular"],
          message: "Celular colombiano (10 dígitos comenzando con 3)",
        });
      }
    }

    // Mínimo 1 forma activa
    const activas =
      Number(data.nequi.activo) +
      Number(data.bancolombia.activo) +
      Number(data.daviplata.activo) +
      Number(data.efectivo_recibir.activo) +
      Number(data.efectivo_local.activo);
    if (activas === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["nequi", "activo"],
        message: "Debes mantener al menos una forma de pago activa",
      });
    }
  });

export type FormasPago = z.infer<typeof FormasPagoSchema>;

export const FORMAS_PAGO_VACIAS: FormasPago = {
  nequi: { activo: false, celular: null },
  bancolombia: { activo: false, cuenta: null, tipo: null },
  daviplata: { activo: false, celular: null },
  efectivo_recibir: { activo: false },
  efectivo_local: { activo: false },
};
