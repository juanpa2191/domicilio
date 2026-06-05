import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TiquetesCocina, type Tiquete } from "./_components/tiquetes-cocina";

export const dynamic = "force-dynamic";

export default async function CocinaHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("usuarios_comercio")
    .select("comercio_id")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();
  if (!row) redirect("/");

  const { data: pedidos } = await admin
    .from("pedidos")
    .select("id, sequence_number, modalidad, adicion_libre, created_at")
    .eq("comercio_id", row.comercio_id)
    .eq("estado", "en_cocina")
    .order("created_at", { ascending: true });

  const ids = (pedidos ?? []).map((p) => p.id);
  const itemsByPedido = new Map<string, Tiquete["items"]>();
  if (ids.length > 0) {
    const { data: items } = await admin
      .from("items_pedido")
      .select("id, pedido_id, cantidad, nombre_snapshot, adiciones_seleccionadas")
      .in("pedido_id", ids);
    items?.forEach((it) => {
      const arr = itemsByPedido.get(it.pedido_id) ?? [];
      arr.push({
        id: it.id,
        cantidad: it.cantidad,
        nombre_snapshot: it.nombre_snapshot,
        adiciones_seleccionadas:
          (it.adiciones_seleccionadas as { nombre: string; precio_adicional: number }[]) ?? [],
      });
      itemsByPedido.set(it.pedido_id, arr);
    });
  }

  const tiquetes: Tiquete[] = (pedidos ?? []).map((p) => ({
    id: p.id,
    sequence_number: p.sequence_number,
    modalidad: p.modalidad,
    adicion_libre: p.adicion_libre,
    created_at: p.created_at,
    items: itemsByPedido.get(p.id) ?? [],
  }));

  return <TiquetesCocina comercioId={row.comercio_id} initialTiquetes={tiquetes} />;
}
