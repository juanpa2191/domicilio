import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

/**
 * Cliente Supabase con service_role: BYPASSEA RLS.
 * USAR SOLO en Server Actions / Route Handlers admin-only.
 * NUNCA exponer al cliente. NUNCA importar en Client Components.
 *
 * architecture.md §Enforcement: usar solo cuando RLS no aplica (operaciones admin).
 */
export function createAdminClient() {
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY) no configurada en env."
    );
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
