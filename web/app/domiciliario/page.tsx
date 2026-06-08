import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ListaEntregas, type Entrega } from "./_components/lista-entregas";

export const dynamic = "force-dynamic";

export default async function DomiciliarioHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: dom } = await admin
    .from("domiciliarios")
    .select("id, comercio_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!dom) redirect("/");

  const { data: pedidos } = await admin
    .from("pedidos")
    .select("id, sequence_number, total_cop, cliente_id, direccion_entrega, created_at")
    .eq("domiciliario_id", dom.id)
    .eq("estado", "en_domicilio")
    .order("created_at", { ascending: true });

  const clienteIds = Array.from(new Set((pedidos ?? []).map((p) => p.cliente_id)));
  const perfilesMap = new Map<string, { nombre: string; celular: string | null }>();
  if (clienteIds.length > 0) {
    const { data: perfiles } = await admin
      .from("perfiles_cliente")
      .select("user_id, nombre, celular")
      .in("user_id", clienteIds);
    perfiles?.forEach((p) =>
      perfilesMap.set(p.user_id, { nombre: p.nombre, celular: p.celular })
    );
  }

  const entregas: Entrega[] = (pedidos ?? []).map((p) => {
    const dir = p.direccion_entrega as
      | { direccion: string; alias?: string | null; lat?: number; lng?: number }
      | null;
    const cliente = perfilesMap.get(p.cliente_id);
    return {
      id: p.id,
      sequence_number: p.sequence_number,
      total_cop: p.total_cop,
      cliente_nombre: cliente?.nombre ?? "Cliente",
      cliente_celular: cliente?.celular ?? null,
      direccion: dir?.direccion ?? "Sin dirección",
      direccion_alias: dir?.alias ?? null,
      created_at: p.created_at,
    };
  });

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-bold">Entregas pendientes</h1>
      <ListaEntregas comercioId={dom.comercio_id} domiciliarioId={dom.id} initial={entregas} />
    </div>
  );
}
