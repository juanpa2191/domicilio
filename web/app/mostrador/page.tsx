import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CerradoTemporalCard } from "./_components/cerrado-temporal-card";

export default async function MostradorHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: mostradorRow } = await supabase
    .from("usuarios_comercio")
    .select("comercio_id")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();
  if (!mostradorRow) return null;

  const admin = createAdminClient();
  const { data: comercio } = await admin
    .from("comercios")
    .select("nombre, cerrado_temporalmente")
    .eq("id", mostradorRow.comercio_id)
    .single();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">
        {comercio?.nombre ?? "Mostrador"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">Cola de Pedidos</p>

      <CerradoTemporalCard initial={comercio?.cerrado_temporalmente ?? false} />

      <div className="mt-8 rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          La Cola FIFO de Pedidos se implementa en Story 4.2 (CORAZÓN del MVP).
        </p>
      </div>
    </div>
  );
}
