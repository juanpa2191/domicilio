"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import type { ActionResult } from "@/types/domicilios";

/**
 * Registra el consentimiento Habeas Data del Cliente.
 * Story 1.8 — Ley 1581 de 2012.
 *
 * Se almacena en user_metadata con timestamp para auditoría.
 */
export async function aceptarPrivacidad(): Promise<ActionResult<{ ok: true }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        privacidad_aceptada: true,
        privacidad_aceptada_at: new Date().toISOString(),
      },
    });
    if (error) throw error;
  } catch (e) {
    captureException(e, { tags: { action: "aceptarPrivacidad" } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo registrar tu consentimiento",
    };
  }

  return { success: true, data: { ok: true } };
}
