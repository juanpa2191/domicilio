/**
 * Helpers de autorización agnósticos de Supabase.
 * architecture.md §Enforcement Rule 3: lib/domicilios/* NO importa lib/supabase/* directo.
 * Recibe SupabaseClient como parámetro y NO conoce el provider concreto.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type RolUsuario = "mostrador" | "cocina" | "domiciliario" | "admin";

export async function getUserRole(
  client: SupabaseClient,
  userId: string
): Promise<RolUsuario | null> {
  // TODO Story 1.2: implementar tras crear tabla usuarios_comercio
  // const { data } = await client.from("usuarios_comercio").select("rol").eq("user_id", userId).single();
  // return data?.rol ?? null;
  void client;
  void userId;
  return null;
}

export async function requireRole(
  client: SupabaseClient,
  userId: string,
  allowedRoles: RolUsuario[]
): Promise<void> {
  const rol = await getUserRole(client, userId);
  if (!rol || !allowedRoles.includes(rol)) {
    throw new Error(`Acceso denegado: rol requerido ${allowedRoles.join("|")}, encontrado ${rol ?? "ninguno"}`);
  }
}
