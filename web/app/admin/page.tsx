import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearCOP } from "@/lib/domicilios/precio";
import { metricasGlobales } from "@/lib/domicilios/admin-metrics";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const admin = createAdminClient();

  const [{ count: comerciosActivos }, { count: comerciosTotal }, metricas] =
    await Promise.all([
      admin.from("comercios").select("id", { count: "exact", head: true }).eq("activo", true),
      admin.from("comercios").select("id", { count: "exact", head: true }),
      metricasGlobales(),
    ]);

  const { agregado, porComercio } = metricas;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/admin/comercios/nuevo">+ Nuevo Comercio</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Comercios activos" value={comerciosActivos ?? 0} sub={`${comerciosTotal ?? 0} totales`} />
        <StatCard label="Pedidos 7 días" value={agregado.pedidos_7d} />
        <StatCard label="Pedidos 30 días" value={agregado.pedidos_30d} sub={`${agregado.cancelados_30d} cancelados`} />
        <StatCard label="Valor transado 30d" value={formatearCOP(agregado.valor_total_30d)} />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Breakdown por Comercio</h2>
          <Link
            href="/admin/comercios"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Ver todos →
          </Link>
        </div>

        {porComercio.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Sin Comercios activos todavía.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Comercio</th>
                  <th className="px-3 py-2 text-right">7d</th>
                  <th className="px-3 py-2 text-right">30d</th>
                  <th className="px-3 py-2 text-right">Cancelados</th>
                  <th className="px-3 py-2 text-right">Valor 30d</th>
                </tr>
              </thead>
              <tbody>
                {porComercio.map((c) => (
                  <tr key={c.comercio_id} className="border-t">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/comercios/${c.comercio_id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {c.nombre}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{c.pedidos_7d}</td>
                    <td className="px-3 py-2 text-right font-mono">{c.pedidos_30d}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {c.cancelados_30d > 0 ? (
                        <span className="text-red-700">{c.cancelados_30d}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatearCOP(c.valor_total_30d)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
