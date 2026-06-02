import { notFound, redirect } from "next/navigation";
import Link from "next/link";
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

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<{ pedidoId: string }>;
}) {
  const { pedidoId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();
  const { data: pedido } = await admin
    .from("pedidos")
    .select("*")
    .eq("id", pedidoId)
    .maybeSingle();

  if (!pedido) notFound();
  if (pedido.cliente_id !== user.id) notFound();

  const { data: items } = await admin
    .from("items_pedido")
    .select("id, nombre_snapshot, cantidad, precio_unitario_cop, adiciones_seleccionadas, subtotal_cop")
    .eq("pedido_id", pedido.id);

  const { data: comercio } = await admin
    .from("comercios")
    .select("nombre")
    .eq("id", pedido.comercio_id)
    .single();

  const estadoMeta = ESTADO_LABEL[pedido.estado] ?? ESTADO_LABEL.pendiente_pago;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/cliente/mis-pedidos"
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          ← Mis pedidos
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{comercio?.nombre}</h1>
        <p className="text-xs text-muted-foreground">
          Pedido #{pedido.sequence_number} · {new Date(pedido.created_at).toLocaleString("es-CO")}
        </p>
      </div>

      <Badge className={`w-fit text-sm ${estadoMeta.tono}`}>{estadoMeta.label}</Badge>

      {pedido.estado === "pendiente_pago" && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col gap-3 p-4 text-sm">
            <p>Aún no has subido el comprobante de pago.</p>
            <Link
              href={`/cliente/pedidos/${pedido.id}/subir-comprobante`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Subir comprobante →
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <p className="text-sm font-semibold">Tu pedido</p>
          <ul className="flex flex-col gap-2 text-sm">
            {items?.map((it) => (
              <li key={it.id} className="flex justify-between gap-2">
                <span>
                  <span className="font-medium">{it.cantidad}×</span> {it.nombre_snapshot}
                  {Array.isArray(it.adiciones_seleccionadas) && it.adiciones_seleccionadas.length > 0 && (
                    <span className="block text-xs text-muted-foreground">
                      +{" "}
                      {(it.adiciones_seleccionadas as { nombre: string }[])
                        .map((a) => a.nombre)
                        .join(", ")}
                    </span>
                  )}
                </span>
                <span className="font-mono">{formatearCOP(it.subtotal_cop)}</span>
              </li>
            ))}
          </ul>
          {pedido.adicion_libre && (
            <p className="mt-2 rounded-md bg-muted p-2 text-xs italic">
              &quot;{pedido.adicion_libre}&quot;
            </p>
          )}
          <div className="mt-3 flex justify-between border-t pt-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-sm font-bold">{formatearCOP(pedido.total_cop)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-[120px_1fr] gap-2 p-4 text-sm">
          <span className="text-muted-foreground">Modalidad</span>
          <span className="capitalize">{pedido.modalidad.replace("_", " ")}</span>
          <span className="text-muted-foreground">Pago</span>
          <span className="capitalize">{pedido.forma_pago.replace("_", " ")}</span>
          {pedido.direccion_entrega && typeof pedido.direccion_entrega === "object" && (
            <>
              <span className="text-muted-foreground">Dirección</span>
              <span>{(pedido.direccion_entrega as { direccion: string }).direccion}</span>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
