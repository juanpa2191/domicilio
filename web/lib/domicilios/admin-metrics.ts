import { createAdminClient } from "@/lib/supabase/admin";

export type MetricasComercio = {
  comercio_id: string;
  pedidos_7d: number;
  pedidos_30d: number;
  valor_total_30d: number;
  cancelados_30d: number;
};

export type MetricasAgregadas = {
  pedidos_7d: number;
  pedidos_30d: number;
  valor_total_30d: number;
  cancelados_30d: number;
};

const dias = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

/** Métricas de un comercio específico. */
export async function metricasPorComercio(comercioId: string): Promise<MetricasComercio> {
  const admin = createAdminClient();
  const desde7 = dias(7);
  const desde30 = dias(30);

  const [{ count: p7 }, p30Res, cancRes] = await Promise.all([
    admin
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("comercio_id", comercioId)
      .gte("created_at", desde7),
    admin
      .from("pedidos")
      .select("total_cop", { count: "exact" })
      .eq("comercio_id", comercioId)
      .gte("created_at", desde30),
    admin
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("comercio_id", comercioId)
      .eq("estado", "cancelado")
      .gte("created_at", desde30),
  ]);

  const valor = (p30Res.data ?? []).reduce((s, r) => s + (r.total_cop ?? 0), 0);

  return {
    comercio_id: comercioId,
    pedidos_7d: p7 ?? 0,
    pedidos_30d: p30Res.count ?? 0,
    valor_total_30d: valor,
    cancelados_30d: cancRes.count ?? 0,
  };
}

/** Métricas agregadas + breakdown por comercio. */
export async function metricasGlobales(): Promise<{
  agregado: MetricasAgregadas;
  porComercio: (MetricasComercio & { nombre: string })[];
}> {
  const admin = createAdminClient();
  const desde7 = dias(7);
  const desde30 = dias(30);

  const [{ data: comercios }, { data: pedidos7 }, { data: pedidos30 }] = await Promise.all([
    admin.from("comercios").select("id, nombre").eq("activo", true),
    admin
      .from("pedidos")
      .select("comercio_id")
      .gte("created_at", desde7),
    admin
      .from("pedidos")
      .select("comercio_id, total_cop, estado")
      .gte("created_at", desde30),
  ]);

  const cs = comercios ?? [];
  const p7 = pedidos7 ?? [];
  const p30 = pedidos30 ?? [];

  const agregado: MetricasAgregadas = {
    pedidos_7d: p7.length,
    pedidos_30d: p30.length,
    valor_total_30d: p30.reduce((s, r) => s + (r.total_cop ?? 0), 0),
    cancelados_30d: p30.filter((r) => r.estado === "cancelado").length,
  };

  const porComercio = cs.map((c) => {
    const p7c = p7.filter((r) => r.comercio_id === c.id).length;
    const p30c = p30.filter((r) => r.comercio_id === c.id);
    return {
      comercio_id: c.id,
      nombre: c.nombre,
      pedidos_7d: p7c,
      pedidos_30d: p30c.length,
      valor_total_30d: p30c.reduce((s, r) => s + (r.total_cop ?? 0), 0),
      cancelados_30d: p30c.filter((r) => r.estado === "cancelado").length,
    };
  });

  return { agregado, porComercio };
}
