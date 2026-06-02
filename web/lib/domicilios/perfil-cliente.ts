import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Garantiza que existe una fila en perfiles_cliente para el user dado.
 * Idempotente — si ya existe no hace nada.
 *
 * Llamado en /auth/callback cuando un Cliente entra por primera vez vía Google.
 */
export async function ensurePerfilCliente(
  adminClient: SupabaseClient,
  userId: string,
  nombre: string
): Promise<void> {
  const { data: existing } = await adminClient
    .from("perfiles_cliente")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return;

  await adminClient.from("perfiles_cliente").insert({
    user_id: userId,
    nombre,
    celular: null,
  });
}
