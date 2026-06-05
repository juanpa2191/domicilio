import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatearCOP } from "@/lib/domicilios/precio";
import { ESTADO_META, tiempoTranscurrido, type EstadoPedido } from "@/lib/domicilios/estado-pedido";
import { ValidarPagoActions } from "./_components/validar-pago-actions";
import { CambiarEstadoActions } from "./_components/cambiar-estado-actions";

export default async function PedidoMostradorPage({
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

  const { data: mostradorRow } = await supabase
    .from("usuarios_comercio")
    .select("comercio_id")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();
  if (!mostradorRow) redirect("/");

  const admin = createAdminClient();
  const { data: pedido } = await admin
    .from("pedidos")
    .select("*")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido) notFound();
  if (pedido.comercio_id !== mostradorRow.comercio_id) notFound();

  const [{ data: items }, { data: clienteUser }, { data: clientePerfil }, { data: domiciliarios }] = await Promise.all([
    admin
      .from("items_pedido")
      .select(
        "id, nombre_snapshot, cantidad, precio_unitario_cop, adiciones_seleccionadas, subtotal_cop"
      )
      .eq("pedido_id", pedido.id),
    admin.auth.admin.getUserById(pedido.cliente_id),
    admin
      .from("perfiles_cliente")
      .select("nombre, celular")
      .eq("user_id", pedido.cliente_id)
      .maybeSingle(),
    admin
      .from("domiciliarios")
      .select("id, nombre")
      .eq("comercio_id", mostradorRow.comercio_id)
      .eq("activo", true)
      .order("nombre"),
  ]);

  const meta = ESTADO_META[pedido.estado as EstadoPedido];
  const direccion = pedido.direccion_entrega as { alias?: string | null; direccion: string } | null;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4">
        <Link
          href="/mostrador"
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          ← Cola de Pedidos
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pedido #{pedido.sequence_number}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date(pedido.created_at).toLocaleString("es-CO")} ·{" "}
            {tiempoTranscurrido(pedido.created_at)}
          </p>
        </div>
        <Badge className={`text-sm ${meta.className}`}>{meta.label}</Badge>
      </div>

      {/* Acciones según estado */}
      {pedido.estado === "validando_pago" && (
        <Card className="mb-4 border-amber-300 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base">Validar pago</CardTitle>
          </CardHeader>
          <CardContent>
            <ValidarPagoActions pedidoId={pedido.id} formaPago={pedido.forma_pago} />
          </CardContent>
        </Card>
      )}

      {["en_cocina", "listo", "en_domicilio"].includes(pedido.estado) && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <CambiarEstadoActions
              pedidoId={pedido.id}
              estado={pedido.estado as EstadoPedido}
              modalidad={pedido.modalidad}
              domiciliarios={domiciliarios ?? []}
            />
          </CardContent>
        </Card>
      )}

      {pedido.estado === "cancelado" && pedido.motivo_cancelacion && (
        <Card className="mb-4 border-red-200 bg-red-50/50">
          <CardContent className="p-4 text-sm">
            <p className="font-semibold text-red-900">Pedido cancelado</p>
            <p className="mt-1 text-xs text-red-900/80">
              Motivo: {pedido.motivo_cancelacion}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cliente */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Cliente</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-[110px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">Nombre</span>
          <span>{clientePerfil?.nombre ?? "—"}</span>
          <span className="text-muted-foreground">Email</span>
          <span className="font-mono text-xs">{clienteUser?.user?.email ?? "—"}</span>
          <span className="text-muted-foreground">Celular</span>
          {clientePerfil?.celular ? (
            <a href={`tel:${clientePerfil.celular}`} className="text-primary underline">
              {clientePerfil.celular}
            </a>
          ) : (
            <span>—</span>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-sm">
            {items?.map((it) => (
              <li key={it.id} className="flex justify-between gap-2">
                <span>
                  <span className="font-medium">{it.cantidad}×</span> {it.nombre_snapshot}
                  {Array.isArray(it.adiciones_seleccionadas) &&
                    it.adiciones_seleccionadas.length > 0 && (
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
            <p className="mt-3 rounded-md bg-muted p-2 text-xs italic">
              &quot;{pedido.adicion_libre}&quot;
            </p>
          )}
          <div className="mt-3 flex justify-between border-t pt-3">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-base font-bold">{formatearCOP(pedido.total_cop)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Modalidad + pago */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entrega y pago</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-[110px_1fr] gap-2 text-sm">
          <span className="text-muted-foreground">Modalidad</span>
          <span className="capitalize">{pedido.modalidad.replace("_", " ")}</span>
          <span className="text-muted-foreground">Pago</span>
          <span className="capitalize">{pedido.forma_pago.replace("_", " ")}</span>
          {direccion && (
            <>
              <span className="text-muted-foreground">Dirección</span>
              <span>
                {direccion.direccion}
                {direccion.alias && (
                  <span className="ml-1 text-xs text-muted-foreground">({direccion.alias})</span>
                )}
              </span>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
