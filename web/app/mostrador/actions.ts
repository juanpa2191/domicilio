"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import type { ActionResult } from "@/types/domicilios";
import { revalidatePath } from "next/cache";

/**
 * Cambia el estado "cerrado_temporalmente" del Comercio.
 * Story 2.6 — FR-17.
 */
export async function setCerradoTemporalmente(
  cerrado: boolean
): Promise<ActionResult<{ cerrado: boolean }>> {
  try {
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

    const admin = createAdminClient();
    const { error } = await admin
      .from("comercios")
      .update({ cerrado_temporalmente: cerrado })
      .eq("id", row.comercio_id);
    if (error) throw error;

    revalidatePath("/mostrador");
    revalidatePath("/mostrador/configuracion");
    revalidatePath("/cliente");
    return { success: true, data: { cerrado } };
  } catch (e) {
    captureException(e, { tags: { action: "setCerradoTemporalmente" } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo cambiar el estado",
    };
  }
}
