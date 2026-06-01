/**
 * Tipos del dominio del negocio.
 * Spanish para dominio (Pedido, Comercio, etc.) — architecture.md §Enforcement Rule 8.
 *
 * Los tipos auto-generados de Supabase van en types/supabase.ts (vendrán en Story 1.2 con migration).
 */

export type EstadoPedido =
  | "pendiente_pago"
  | "validando_pago"
  | "en_cocina"
  | "listo"
  | "en_domicilio"
  | "entregado"
  | "cancelado";

export type ModalidadEntrega = "domicilio" | "recoger_en_local";

export type FormaPago = "transferencia" | "efectivo_recibir" | "efectivo_local";

export type RolUsuario = "mostrador" | "cocina" | "domiciliario" | "admin";

/**
 * Discriminated union para todas las Server Actions.
 * architecture.md §Enforcement Rule 1.
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; field?: string };
