"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import {
  ActualizarComercioSchema,
  type ActualizarComercioInput,
} from "@/lib/domicilios/schemas/comercio";
import type { ActionResult } from "@/types/domicilios";
import { revalidatePath } from "next/cache";

/**
 * Actualiza información básica del Comercio (nombre, dirección, horario, foto).
 * Story 2.1 — FR-23.
 *
 * Solo el Mostrador del propio Comercio puede ejecutarla.
 */
export async function actualizarComercio(
  input: ActualizarComercioInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = ActualizarComercioSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Datos inválidos",
      field: first?.path.join(".") || undefined,
    };
  }
  const data = parsed.data;

  // Auth check: usuario autenticado + rol mostrador
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
    return { success: false, error: "Solo el Mostrador puede editar el Comercio" };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("comercios")
      .update({
        nombre: data.nombre,
        direccion: data.direccion,
        horario: data.horario,
        foto_principal_url: data.foto_principal_url ?? null,
      })
      .eq("id", mostradorRow.comercio_id);
    if (error) throw error;

    revalidatePath("/mostrador/configuracion");
    revalidatePath("/cliente");
    return { success: true, data: { id: mostradorRow.comercio_id } };
  } catch (e) {
    captureException(e, { tags: { action: "actualizarComercio" } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo actualizar el Comercio",
    };
  }
}
