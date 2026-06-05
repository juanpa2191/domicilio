"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireCocina() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("usuarios_comercio")
    .select("comercio_id, rol")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();
  if (!row || row.rol !== "cocina") throw new Error("Solo el rol Cocina puede hacer esto");
  return { userId: user.id, comercioId: row.comercio_id, admin };
}

export async function marcarListoCocina(pedidoId: string): Promise<ActionResult> {
  try {
    const { userId, comercioId, admin } = await requireCocina();

    const { data: pedido } = await admin
      .from("pedidos")
      .select("id, comercio_id, estado")
      .eq("id", pedidoId)
      .maybeSingle();

    if (!pedido) return { success: false, error: "Pedido no encontrado" };
    if (pedido.comercio_id !== comercioId)
      return { success: false, error: "Pedido de otro comercio" };
    if (pedido.estado !== "en_cocina")
      return { success: false, error: `No se puede marcar listo desde "${pedido.estado}"` };

    const { error: upErr } = await admin
      .from("pedidos")
      .update({ estado: "listo" })
      .eq("id", pedidoId);
    if (upErr) return { success: false, error: upErr.message };

    await admin.from("historial_estado_pedido").insert({
      pedido_id: pedidoId,
      estado_anterior: "en_cocina",
      estado_nuevo: "listo",
      actor_user_id: userId,
    });

    revalidatePath("/cocina");
    revalidatePath("/mostrador");
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error desconocido" };
  }
}
