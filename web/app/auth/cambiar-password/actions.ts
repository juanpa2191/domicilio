"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import {
  CambiarPasswordSchema,
  type CambiarPasswordInput,
} from "@/lib/domicilios/schemas/auth";
import type { ActionResult } from "@/types/domicilios";

/**
 * Cambia la contraseña del usuario autenticado y limpia la flag
 * `must_change_password` si estaba activa.
 */
export async function cambiarPassword(
  input: CambiarPasswordInput
): Promise<ActionResult<{ ok: true }>> {
  const parsed = CambiarPasswordSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Datos inválidos",
      field: first?.path[0]?.toString(),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  // Update password como el propio usuario
  const { error: updateErr } = await supabase.auth.updateUser({
    password: parsed.data.nueva_password,
  });
  if (updateErr) {
    captureException(updateErr, { tags: { action: "cambiarPassword.updateUser" } });
    return { success: false, error: updateErr.message };
  }

  // Limpiar la flag must_change_password (vía admin client porque user no puede
  // modificar su propio raw_user_meta_data desde el cliente).
  try {
    const admin = createAdminClient();
    const { error: metaErr } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        must_change_password: false,
      },
    });
    if (metaErr) throw metaErr;
  } catch (e) {
    captureException(e, { tags: { action: "cambiarPassword.clearFlag" } });
    // No bloqueamos al user — la contraseña ya cambió. La flag puede limpiarse manualmente.
  }

  return { success: true, data: { ok: true } };
}
