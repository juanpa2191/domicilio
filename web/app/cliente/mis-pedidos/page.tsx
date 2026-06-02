import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatearCOP } from "@/lib/domicilios/precio";

const ESTADO_LABEL: Record<string, { label: string; tono: string }> = {
  pendiente_pago: { label: "Pendiente de pago", tono: "bg-amber-100 text-amber-900 border-amber-200" },
  validando_pago: { label: "Validando pago", tono: "bg-amber-100 text-amber-900 border-amber-200" },
  en_cocina: { label: "En cocina", tono: "bg-orange-100 text-orange-900 border-orange-200" },
  listo: { label: "Listo", tono: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  en_domicilio: { label: "En camino", tono: "bg-blue-100 text-blue-900 border-blue-200" },
  entregado: { label: "Entregado", tono: "bg-slate-100 text-slate-700 border-slate-200" },
  cancelado: { label: "Cancelado", tono: "bg-red-100 text-red-900 border-red-200" },
};

export default async function MisPedidosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: pedidos } = await admin
    .from("pedidos")
    .select("id, sequence_number, estado, total_cop, comercio_id, created_at, modalidad")
    .eq("cliente_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const comercioIds = Array.from(new Set((pedidos ?? []).map((p) => p.comercio_id)));
  const comerciosMap = new Map<string, string>();
  if (comercioIds.length > 0) {
    const { data: cs } = await admin.from("comercios").select("id, nombre").in("id", comercioIds);
    cs?.forEach((c) => comerciosMap.set(c.id, c.nombre));
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Mis pedidos</h1>

      {!pedidos || pedidos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          Aún no has hecho ningún pedido.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {pedidos.map((p) => {
            const meta = ESTADO_LABEL[p.estado] ?? ESTADO_LABEL.pendiente_pago;
            return (
              <li key={p.id}>
                <Link href={`/cliente/pedidos/${p.id}`}>
                  <Card className="transition-colors hover:bg-muted/30">
                    <CardContent className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-medium">{comerciosMap.get(p.comercio_id) ?? "Comercio"}</p>
                        <p className="text-xs text-muted-foreground">
                          #{p.sequence_number} ·{" "}
                          {new Date(p.created_at).toLocaleString("es-CO", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={`text-xs ${meta.tono}`}>{meta.label}</Badge>
                        <span className="text-sm font-semibold">{formatearCOP(p.total_cop)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
