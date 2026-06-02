"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import { CelularSchema, type CelularInput } from "@/lib/domicilios/schemas/perfil-cliente";
import type { ActionResult } from "@/types/domicilios";
import { revalidatePath } from "next/cache";

/**
 * Guarda el celular del Cliente en su perfil.
 * Story 3.2 — FR-1 (revisada por D-21).
 */
export async function guardarCelular(
  input: CelularInput
): Promise<ActionResult<{ celular: string }>> {
  const parsed = CelularSchema.safeParse(input);
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

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("perfiles_cliente")
      .update({ celular: parsed.data.celular })
      .eq("user_id", user.id);
    if (error) throw error;

    revalidatePath("/cliente");
    revalidatePath("/cliente/cuenta/celular");
    return { success: true, data: { celular: parsed.data.celular } };
  } catch (e) {
    captureException(e, { tags: { action: "guardarCelular" } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo guardar tu celular",
    };
  }
}
