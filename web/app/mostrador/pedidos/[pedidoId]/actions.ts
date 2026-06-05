"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import type { ActionResult } from "@/types/domicilios";
import { revalidatePath } from "next/cache";

type EstadoPedido =
  | "pendiente_pago"
  | "validando_pago"
  | "en_cocina"
  | "listo"
  | "en_domicilio"
  | "entregado"
  | "cancelado";

/** Devuelve user + comercio_id si es Mostrador, throw si no. */
async function requireMostrador() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: row } = await supabase
    .from("usuarios_comercio")
    .select("comercio_id, rol")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();
  if (!row || row.rol !== "mostrador") throw new Error("Solo el Mostrador");
  return { userId: user.id, comercioId: row.comercio_id };
}

/** Confirma el pago de un Pedido en validando_pago → en_cocina. Story 4.4. */
export async function confirmarPago(
  pedidoId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { userId, comercioId } = await requireMostrador();
    const admin = createAdminClient();

    // Verificar que el Pedido es del comercio y está en validando_pago
    const { data: pedido } = await admin
      .from("pedidos")
      .select("id, estado, comercio_id")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!pedido || pedido.comercio_id !== comercioId) {
      return { success: false, error: "Pedido no encontrado" };
    }
    if (pedido.estado !== "validando_pago") {
      return { success: false, error: `No se puede confirmar pago en estado "${pedido.estado}"` };
    }

    // Cargar storage_path del comprobante (si existe) para audit
    const { data: comprobante } = await admin
      .from("comprobantes_pago")
      .select("storage_path")
      .eq("pedido_id", pedidoId)
      .maybeSingle();

    // Update estado
    const { error: updErr } = await admin
      .from("pedidos")
      .update({ estado: "en_cocina" })
      .eq("id", pedidoId);
    if (updErr) throw updErr;

    // Insert audit
    await admin.from("payment_audit").insert({
      pedido_id: pedidoId,
      validador_user_id: userId,
      accion: "confirmar",
      comprobante_storage_path: comprobante?.storage_path ?? null,
    });

    // Insert historial
    await admin.from("historial_estado_pedido").insert({
      pedido_id: pedidoId,
      estado_anterior: "validando_pago",
      estado_nuevo: "en_cocina",
      actor_user_id: userId,
    });

    revalidatePath("/mostrador");
    revalidatePath(`/mostrador/pedidos/${pedidoId}`);
    revalidatePath(`/cocina`);
    revalidatePath(`/cliente/pedidos/${pedidoId}`);
    return { success: true, data: { id: pedidoId } };
  } catch (e) {
    captureException(e, { tags: { action: "confirmarPago", pedidoId } });
    return { success: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Rechaza el pago de un Pedido en validando_pago → cancelado. Story 4.4. */
export async function rechazarPago(
  pedidoId: string,
  motivo: string
): Promise<ActionResult<{ id: string }>> {
  if (!motivo || motivo.trim().length < 3) {
    return { success: false, error: "Motivo requerido (min 3 caracteres)" };
  }
  const motivoTrim = motivo.trim().slice(0, 140);

  try {
    const { userId, comercioId } = await requireMostrador();
    const admin = createAdminClient();

    const { data: pedido } = await admin
      .from("pedidos")
      .select("id, estado, comercio_id")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!pedido || pedido.comercio_id !== comercioId) {
      return { success: false, error: "Pedido no encontrado" };
    }
    if (pedido.estado !== "validando_pago") {
      return { success: false, error: `No se puede rechazar pago en estado "${pedido.estado}"` };
    }

    const { data: comprobante } = await admin
      .from("comprobantes_pago")
      .select("storage_path")
      .eq("pedido_id", pedidoId)
      .maybeSingle();

    const { error: updErr } = await admin
      .from("pedidos")
      .update({ estado: "cancelado", motivo_cancelacion: motivoTrim })
      .eq("id", pedidoId);
    if (updErr) throw updErr;

    await admin.from("payment_audit").insert({
      pedido_id: pedidoId,
      validador_user_id: userId,
      accion: "rechazar",
      motivo: motivoTrim,
      comprobante_storage_path: comprobante?.storage_path ?? null,
    });

    await admin.from("historial_estado_pedido").insert({
      pedido_id: pedidoId,
      estado_anterior: "validando_pago",
      estado_nuevo: "cancelado",
      actor_user_id: userId,
      motivo: motivoTrim,
    });

    revalidatePath("/mostrador");
    revalidatePath(`/mostrador/pedidos/${pedidoId}`);
    revalidatePath(`/cliente/pedidos/${pedidoId}`);
    return { success: true, data: { id: pedidoId } };
  } catch (e) {
    captureException(e, { tags: { action: "rechazarPago", pedidoId } });
    return { success: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/**
 * Cambia el estado del Pedido manualmente. Story 4.5.
 * Transiciones válidas:
 *   en_cocina → listo
 *   listo → en_domicilio (requiere domiciliario_id si modalidad=domicilio)
 *   listo → entregado (si modalidad=recoger_en_local)
 *   en_domicilio → entregado
 */
export async function cambiarEstadoPedido(
  pedidoId: string,
  nuevoEstado: EstadoPedido,
  domiciliarioId?: string | null
): Promise<ActionResult<{ id: string; estado: EstadoPedido }>> {
  try {
    const { userId, comercioId } = await requireMostrador();
    const admin = createAdminClient();

    const { data: pedido } = await admin
      .from("pedidos")
      .select("id, estado, comercio_id, modalidad")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!pedido || pedido.comercio_id !== comercioId) {
      return { success: false, error: "Pedido no encontrado" };
    }

    // Transiciones válidas
    const transicionesValidas: Record<string, EstadoPedido[]> = {
      validando_pago: ["en_cocina"],
      en_cocina: ["listo"],
      listo: ["en_domicilio", "entregado", "en_cocina"],
      en_domicilio: ["entregado"],
    };
    const permitidas = transicionesValidas[pedido.estado] ?? [];
    if (!permitidas.includes(nuevoEstado)) {
      return {
        success: false,
        error: `No se puede pasar de "${pedido.estado}" a "${nuevoEstado}"`,
      };
    }

    // Si va a en_domicilio en modalidad domicilio, requiere domiciliario
    if (nuevoEstado === "en_domicilio") {
      if (pedido.modalidad !== "domicilio") {
        return {
          success: false,
          error: "Solo pedidos de domicilio pueden estar 'en domicilio'",
        };
      }
      if (!domiciliarioId) {
        return { success: false, error: "Selecciona un Domiciliario" };
      }
      // Verificar que el domiciliario es del comercio y activo
      const { data: dom } = await admin
        .from("domiciliarios")
        .select("id, comercio_id, activo")
        .eq("id", domiciliarioId)
        .maybeSingle();
      if (!dom || dom.comercio_id !== comercioId || !dom.activo) {
        return { success: false, error: "Domiciliario no encontrado" };
      }
    }

    // listo → entregado solo si modalidad = recoger_en_local
    if (
      pedido.estado === "listo" &&
      nuevoEstado === "entregado" &&
      pedido.modalidad !== "recoger_en_local"
    ) {
      return {
        success: false,
        error: "Para domicilio debes asignar un Domiciliario primero",
      };
    }

    const { error: updErr } = await admin
      .from("pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", pedidoId);
    if (updErr) throw updErr;

    await admin.from("historial_estado_pedido").insert({
      pedido_id: pedidoId,
      estado_anterior: pedido.estado,
      estado_nuevo: nuevoEstado,
      actor_user_id: userId,
      motivo:
        nuevoEstado === "en_domicilio" && domiciliarioId
          ? `Asignado a domiciliario ${domiciliarioId}`
          : null,
    });

    revalidatePath("/mostrador");
    revalidatePath(`/mostrador/pedidos/${pedidoId}`);
    revalidatePath(`/cocina`);
    revalidatePath(`/cliente/pedidos/${pedidoId}`);
    return { success: true, data: { id: pedidoId, estado: nuevoEstado } };
  } catch (e) {
    captureException(e, { tags: { action: "cambiarEstadoPedido", pedidoId } });
    return { success: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Cancela un Pedido (cualquier estado activo). Story 4.5. */
export async function cancelarPedido(
  pedidoId: string,
  motivo: string
): Promise<ActionResult<{ id: string }>> {
  if (!motivo || motivo.trim().length < 3) {
    return { success: false, error: "Motivo requerido (min 3 caracteres)" };
  }
  const motivoTrim = motivo.trim().slice(0, 140);

  try {
    const { userId, comercioId } = await requireMostrador();
    const admin = createAdminClient();

    const { data: pedido } = await admin
      .from("pedidos")
      .select("id, estado, comercio_id")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!pedido || pedido.comercio_id !== comercioId) {
      return { success: false, error: "Pedido no encontrado" };
    }
    if (pedido.estado === "entregado" || pedido.estado === "cancelado") {
      return {
        success: false,
        error: `No se puede cancelar un pedido "${pedido.estado}"`,
      };
    }

    const { error: updErr } = await admin
      .from("pedidos")
      .update({ estado: "cancelado", motivo_cancelacion: motivoTrim })
      .eq("id", pedidoId);
    if (updErr) throw updErr;

    await admin.from("historial_estado_pedido").insert({
      pedido_id: pedidoId,
      estado_anterior: pedido.estado,
      estado_nuevo: "cancelado",
      actor_user_id: userId,
      motivo: motivoTrim,
    });

    revalidatePath("/mostrador");
    revalidatePath(`/mostrador/pedidos/${pedidoId}`);
    revalidatePath(`/cocina`);
    revalidatePath(`/cliente/pedidos/${pedidoId}`);
    return { success: true, data: { id: pedidoId } };
  } catch (e) {
    captureException(e, { tags: { action: "cancelarPedido", pedidoId } });
    return { success: false, error: e instanceof Error ? e.message : "Error" };
  }
}

/** Genera URL firmada (TTL 10 min) para que el Mostrador vea el comprobante. Story 4.3. */
export async function obtenerComprobanteUrl(
  pedidoId: string
): Promise<ActionResult<{ url: string }>> {
  try {
    const { comercioId } = await requireMostrador();
    const admin = createAdminClient();

    const { data: pedido } = await admin
      .from("pedidos")
      .select("id, comercio_id")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!pedido || pedido.comercio_id !== comercioId) {
      return { success: false, error: "Pedido no encontrado" };
    }

    const { data: comp } = await admin
      .from("comprobantes_pago")
      .select("storage_path")
      .eq("pedido_id", pedidoId)
      .maybeSingle();
    if (!comp) return { success: false, error: "Sin comprobante registrado" };

    const { data, error } = await admin.storage
      .from("comprobantes-pago")
      .createSignedUrl(comp.storage_path, 600); // 10 min
    if (error) throw error;

    return { success: true, data: { url: data.signedUrl } };
  } catch (e) {
    captureException(e, { tags: { action: "obtenerComprobanteUrl", pedidoId } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error al obtener comprobante",
    };
  }
}
