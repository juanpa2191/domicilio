"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireDomiciliario() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const admin = createAdminClient();
  const { data: dom } = await admin
    .from("domiciliarios")
    .select("id, comercio_id, activo")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!dom || !dom.activo) throw new Error("Solo Domiciliarios activos");
  return { userId: user.id, domiciliarioId: dom.id, comercioId: dom.comercio_id, admin };
}

export async function actualizarUbicacionDomiciliario(
  pedidoId: string,
  lat: number,
  lng: number
): Promise<ActionResult> {
  try {
    const { domiciliarioId, admin } = await requireDomiciliario();

    // Validar que el pedido le pertenece y está en_domicilio
    const { data: pedido } = await admin
      .from("pedidos")
      .select("id, domiciliario_id, estado")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!pedido || pedido.domiciliario_id !== domiciliarioId) {
      return { success: false, error: "Pedido no encontrado" };
    }
    if (pedido.estado !== "en_domicilio") {
      return { success: false, error: "Pedido no está en domicilio" };
    }

    const { error } = await admin
      .from("pedidos")
      .update({
        tracking_lat: lat,
        tracking_lng: lng,
        tracking_updated_at: new Date().toISOString(),
      })
      .eq("id", pedidoId);
    if (error) throw error;

    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export async function marcarEntregadoDomiciliario(
  pedidoId: string
): Promise<ActionResult> {
  try {
    const { userId, domiciliarioId, admin } = await requireDomiciliario();

    const { data: pedido } = await admin
      .from("pedidos")
      .select("id, domiciliario_id, estado")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!pedido || pedido.domiciliario_id !== domiciliarioId) {
      return { success: false, error: "Pedido no encontrado" };
    }
    if (pedido.estado !== "en_domicilio") {
      return { success: false, error: `No se puede entregar desde "${pedido.estado}"` };
    }

    const { error: upErr } = await admin
      .from("pedidos")
      .update({
        estado: "entregado",
        tracking_lat: null,
        tracking_lng: null,
        tracking_updated_at: null,
      })
      .eq("id", pedidoId);
    if (upErr) return { success: false, error: upErr.message };

    await admin.from("historial_estado_pedido").insert({
      pedido_id: pedidoId,
      estado_anterior: "en_domicilio",
      estado_nuevo: "entregado",
      actor_user_id: userId,
      motivo: "Marcado entregado por Domiciliario",
    });

    revalidatePath("/domiciliario");
    revalidatePath("/mostrador");
    revalidatePath(`/cliente/pedidos/${pedidoId}`);
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error" };
  }
}
