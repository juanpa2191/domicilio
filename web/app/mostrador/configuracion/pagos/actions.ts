"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import {
  FormasPagoSchema,
  type FormasPago,
} from "@/lib/domicilios/schemas/formas-pago";
import type { ActionResult } from "@/types/domicilios";
import { revalidatePath } from "next/cache";

/**
 * Actualiza las formas de pago aceptadas por el Comercio.
 * Story 2.2 — FR-24.
 */
export async function actualizarFormasPago(
  input: FormasPago
): Promise<ActionResult<{ ok: true }>> {
  const parsed = FormasPagoSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Datos inválidos",
      field: first?.path.join(".") || undefined,
    };
  }
  const data = parsed.data;

  // Auth: solo Mostrador del propio Comercio
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { data: mostradorRow } = await supabase
    .from("usuarios_comercio")
    .select("comercio_id, rol")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!mostradorRow || mostradorRow.rol !== "mostrador") {
    return { success: false, error: "Solo el Mostrador puede editar pagos" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("comercios")
      .update({ formas_pago: data })
      .eq("id", mostradorRow.comercio_id);
    if (error) throw error;

    revalidatePath("/mostrador/configuracion/pagos");
    return { success: true, data: { ok: true } };
  } catch (e) {
    captureException(e, { tags: { action: "actualizarFormasPago" } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudieron guardar las formas de pago",
    };
  }
}
