/**
 * Helpers de autorización agnósticos de Supabase.
 * architecture.md §Enforcement Rule 3: lib/domicilios/* NO importa lib/supabase/* directo.
 * Recibe SupabaseClient como parámetro y NO conoce el provider concreto.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type RolUsuario = "mostrador" | "cocina" | "domiciliario";
export type SurfaceDestino = "admin" | "mostrador" | "cocina" | "domiciliario" | "cliente";

/**
 * Determina a qué surface debe ir un usuario autenticado según su rol.
 * Prioridad: admin > rol comercio > cliente (default).
 */
export async function getUserSurface(
  client: SupabaseClient,
  userId: string
): Promise<SurfaceDestino> {
  // 1. ¿Es platform admin?
  const { data: admin } = await client
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (admin) return "admin";

  // 2. ¿Pertenece a un Comercio? (busca el primer rol activo)
  const { data: uc } = await client
    .from("usuarios_comercio")
    .select("rol")
    .eq("user_id", userId)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();
  if (uc?.rol === "mostrador") return "mostrador";
  if (uc?.rol === "cocina") return "cocina";
  if (uc?.rol === "domiciliario") return "domiciliario";

  // 3. Default: Cliente (puede ser usuario nuevo de Google que aún no es admin ni de comercio).
  return "cliente";
}

/**
 * Retorna el rol del usuario en su comercio activo.
 * Retorna null si no es de un comercio (admin o cliente).
 */
export async function getUserRole(
  client: SupabaseClient,
  userId: string
): Promise<RolUsuario | null> {
  const { data } = await client
    .from("usuarios_comercio")
    .select("rol")
    .eq("user_id", userId)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();
  return (data?.rol as RolUsuario) ?? null;
}

/**
 * Lanza error si el usuario no tiene uno de los roles permitidos.
 */
export async function requireRole(
  client: SupabaseClient,
  userId: string,
  allowedRoles: RolUsuario[]
): Promise<void> {
  const rol = await getUserRole(client, userId);
  if (!rol || !allowedRoles.includes(rol)) {
    throw new Error(
      `Acceso denegado: rol requerido ${allowedRoles.join("|")}, encontrado ${rol ?? "ninguno"}`
    );
  }
}
