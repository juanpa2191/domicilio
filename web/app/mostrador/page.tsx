import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CerradoTemporalCard } from "./_components/cerrado-temporal-card";
import { ColaFifo, type PedidoCola } from "./_components/cola-fifo";

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
  const [{ data: comercio }, { data: pedidos }] = await Promise.all([
    admin
      .from("comercios")
      .select("nombre, cerrado_temporalmente")
      .eq("id", mostradorRow.comercio_id)
      .single(),
    admin
      .from("pedidos")
      .select(
        "id, sequence_number, estado, modalidad, forma_pago, total_cop, created_at, adicion_libre"
      )
      .eq("comercio_id", mostradorRow.comercio_id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{comercio?.nombre ?? "Mostrador"}</h1>
          <p className="text-sm text-muted-foreground">Cola de Pedidos</p>
        </div>
      </div>

      <div className="mb-6">
        <CerradoTemporalCard initial={comercio?.cerrado_temporalmente ?? false} />
      </div>

      <ColaFifo
        comercioId={mostradorRow.comercio_id}
        initialPedidos={(pedidos ?? []) as PedidoCola[]}
      />
    </div>
  );
}
