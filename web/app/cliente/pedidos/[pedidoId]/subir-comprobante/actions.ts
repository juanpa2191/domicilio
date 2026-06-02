"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import type { ActionResult } from "@/types/domicilios";
import { revalidatePath } from "next/cache";

/**
 * Registra el storage_path del comprobante subido por el Cliente y pone el
 * Pedido en `validando_pago` para que el Mostrador lo verifique.
 * Story 3.8 — FR-13.
 *
 * El upload del archivo se hace desde el cliente directamente al bucket privado.
 * Aquí solo registramos el path después de que la subida fue exitosa.
 */
export async function registrarComprobante(
  pedidoId: string,
  storagePath: string
): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  try {
    const admin = createAdminClient();

    // Validar que el Pedido es del Cliente y está en pendiente_pago
    const { data: pedido } = await admin
      .from("pedidos")
      .select("id, cliente_id, estado")
      .eq("id", pedidoId)
      .maybeSingle();
    if (!pedido || pedido.cliente_id !== user.id) {
      return { success: false, error: "Pedido no encontrado" };
    }
    if (pedido.estado !== "pendiente_pago") {
      return { success: false, error: "Este pedido ya no admite comprobante" };
    }

    // Insertar comprobante (unique por pedido_id — si existe, upsert)
    const { error: comprobErr } = await admin
      .from("comprobantes_pago")
      .upsert({ pedido_id: pedidoId, storage_path: storagePath }, { onConflict: "pedido_id" });
    if (comprobErr) throw comprobErr;

    // Pasar Pedido a validando_pago
    const { error: estadoErr } = await admin
      .from("pedidos")
      .update({ estado: "validando_pago" })
      .eq("id", pedidoId);
    if (estadoErr) throw estadoErr;

    revalidatePath(`/cliente/pedidos/${pedidoId}`);
    revalidatePath(`/cliente/mis-pedidos`);
    revalidatePath("/mostrador");
    return { success: true, data: { ok: true } };
  } catch (e) {
    captureException(e, { tags: { action: "registrarComprobante", pedidoId } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo registrar el comprobante",
    };
  }
}
