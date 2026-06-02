import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { HORARIO_VACIO, type Horario } from "@/lib/domicilios/schemas/comercio";
import { ConfiguracionForm } from "./_components/configuracion-form";

/**
 * Configuración del Comercio del Mostrador.
 * Usa admin client para lectura (la auth check se hace en mostrador/layout.tsx).
 * Esto evita depender del JWT claim tenant_id (Auth Hook).
 */
export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Obtener comercio_id desde la fila propia del Mostrador (usa self-select policy)
  const { data: mostradorRow } = await supabase
    .from("usuarios_comercio")
    .select("comercio_id")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!mostradorRow) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-muted-foreground">
          No estás vinculado a ningún Comercio.
        </p>
      </div>
    );
  }

  // Usar admin client para leer datos del Comercio (bypass RLS)
  const admin = createAdminClient();
  const { data: comercio } = await admin
    .from("comercios")
    .select("nombre, direccion, horario, foto_principal_url")
    .eq("id", mostradorRow.comercio_id)
    .single();

  const horarioParsed =
    comercio?.horario && typeof comercio.horario === "object"
      ? ({ ...HORARIO_VACIO, ...(comercio.horario as Partial<Horario>) } as Horario)
      : HORARIO_VACIO;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Configuración del Comercio</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Estos datos se ven en la app del Cliente al elegir un Comercio para pedir.
      </p>

      <ConfiguracionForm
        comercioId={mostradorRow.comercio_id}
        initial={{
          nombre: comercio?.nombre ?? "",
          direccion: comercio?.direccion ?? "",
          horario: horarioParsed,
          foto_principal_url: comercio?.foto_principal_url ?? null,
        }}
      />
    </div>
  );
}
