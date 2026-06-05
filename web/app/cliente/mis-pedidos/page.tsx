import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatearCOP } from "@/lib/domicilios/precio";

type Estado =
  | "pendiente_pago"
  | "validando_pago"
  | "en_cocina"
  | "listo"
  | "en_domicilio"
  | "entregado"
  | "cancelado";

const ESTADO_LABEL: Record<Estado, { label: string; tono: string }> = {
  pendiente_pago: { label: "Pendiente de pago", tono: "bg-amber-100 text-amber-900 border-amber-200" },
  validando_pago: { label: "Validando pago", tono: "bg-amber-100 text-amber-900 border-amber-200" },
  en_cocina: { label: "En cocina", tono: "bg-orange-100 text-orange-900 border-orange-200" },
  listo: { label: "Listo", tono: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  en_domicilio: { label: "En camino", tono: "bg-blue-100 text-blue-900 border-blue-200" },
  entregado: { label: "Entregado", tono: "bg-slate-100 text-slate-700 border-slate-200" },
  cancelado: { label: "Cancelado", tono: "bg-red-100 text-red-900 border-red-200" },
};

const ACTIVOS: Estado[] = [
  "pendiente_pago",
  "validando_pago",
  "en_cocina",
  "listo",
  "en_domicilio",
];

type PedidoRow = {
  id: string;
  sequence_number: number;
  estado: Estado;
  total_cop: number;
  comercio_id: string;
  created_at: string;
  modalidad: "domicilio" | "recoger_en_local";
};

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

  const list = (pedidos ?? []) as PedidoRow[];
  const activos = list.filter((p) => ACTIVOS.includes(p.estado));
  const historial = list.filter((p) => !ACTIVOS.includes(p.estado));

  const comercioIds = Array.from(new Set(list.map((p) => p.comercio_id)));
  const comerciosMap = new Map<string, string>();
  if (comercioIds.length > 0) {
    const { data: cs } = await admin
      .from("comercios")
      .select("id, nombre")
      .in("id", comercioIds);
    cs?.forEach((c) => comerciosMap.set(c.id, c.nombre));
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Mis pedidos</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Activos {activos.length > 0 && `(${activos.length}/3)`}
        </h2>
        {activos.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Sin pedidos activos.{" "}
            <Link href="/cliente" className="text-primary underline-offset-4 hover:underline">
              Ver comercios →
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {activos.map((p) => (
              <PedidoCard key={p.id} pedido={p} comercio={comerciosMap.get(p.comercio_id)} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Historial (últimos 30 días)
        </h2>
        {historial.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aún no tienes pedidos en historial.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {historial.map((p) => (
              <PedidoCard key={p.id} pedido={p} comercio={comerciosMap.get(p.comercio_id)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PedidoCard({
  pedido,
  comercio,
}: {
  pedido: PedidoRow;
  comercio: string | undefined;
}) {
  const meta = ESTADO_LABEL[pedido.estado];
  return (
    <li>
      <Link href={`/cliente/pedidos/${pedido.id}`}>
        <Card className="transition-colors hover:bg-muted/30">
          <CardContent className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{comercio ?? "Comercio"}</p>
              <p className="text-xs text-muted-foreground">
                #{pedido.sequence_number} ·{" "}
                {new Date(pedido.created_at).toLocaleString("es-CO", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={`text-xs ${meta.tono}`}>{meta.label}</Badge>
              <span className="text-sm font-semibold">{formatearCOP(pedido.total_cop)}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </li>
  );
}
