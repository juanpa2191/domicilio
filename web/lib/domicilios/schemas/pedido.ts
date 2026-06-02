import { z } from "zod";

export const AdicionSeleccionadaSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string(),
  precio_adicional: z.number().int().min(0),
});

export const ItemPedidoSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.number().int().min(1).max(99),
  adiciones: z.array(AdicionSeleccionadaSchema).default([]),
});

export const DireccionEntregaSchema = z.object({
  alias: z.string().optional().nullable(),
  direccion: z.string().min(5, "Dirección requerida").max(300),
});

export const ModalidadSchema = z.enum(["domicilio", "recoger_en_local"]);
export const FormaPagoSchema = z.enum([
  "transferencia",
  "efectivo_recibir",
  "efectivo_local",
]);

export const CrearPedidoSchema = z
  .object({
    comercio_id: z.string().uuid(),
    items: z.array(ItemPedidoSchema).min(1, "Tu carrito está vacío"),
    adicion_libre: z.string().max(280).optional().nullable(),
    modalidad: ModalidadSchema,
    forma_pago: FormaPagoSchema,
    direccion_entrega: DireccionEntregaSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.modalidad === "domicilio" && !data.direccion_entrega) {
      ctx.addIssue({
        code: "custom",
        path: ["direccion_entrega"],
        message: "Necesitamos una dirección para entregarte",
      });
    }
    // Validar coherencia modalidad ↔ forma de pago
    if (data.modalidad === "recoger_en_local" && data.forma_pago === "efectivo_recibir") {
      ctx.addIssue({
        code: "custom",
        path: ["forma_pago"],
        message: "Esta forma de pago es solo para domicilio",
      });
    }
    if (data.modalidad === "domicilio" && data.forma_pago === "efectivo_local") {
      ctx.addIssue({
        code: "custom",
        path: ["forma_pago"],
        message: "Esta forma de pago es solo para recoger en local",
      });
    }
  });

export type CrearPedidoInput = z.infer<typeof CrearPedidoSchema>;
