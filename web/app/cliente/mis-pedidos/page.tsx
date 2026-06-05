import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ListaPedidosCliente,
  type PedidoRow,
} from "./_components/lista-pedidos-cliente";

export const dynamic = "force-dynamic";

export default async function MisPedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const treintaDias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: pedidos } = await admin
    .from("pedidos")
    .select("id, sequence_number, estado, total_cop, comercio_id, created_at, modalidad")
    .eq("cliente_id", user.id)
    .gte("created_at", treintaDias)
    .order("created_at", { ascending: false })
    .limit(50);

  const inicialPedidos = (pedidos ?? []) as PedidoRow[];

  const comercioIds = Array.from(new Set(inicialPedidos.map((p) => p.comercio_id)));
  const inicialComercios: Record<string, string> = {};
  if (comercioIds.length > 0) {
    const { data: cs } = await admin
      .from("comercios")
      .select("id, nombre")
      .in("id", comercioIds);
    cs?.forEach((c) => (inicialComercios[c.id] = c.nombre));
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Mis pedidos</h1>
      <ListaPedidosCliente
        clienteId={user.id}
        inicialPedidos={inicialPedidos}
        inicialComercios={inicialComercios}
      />
    </div>
  );
}
