import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent } from "@/components/ui/card";
import { formatearCOP } from "@/lib/domicilios/precio";
import { SeguimientoPedido } from "./_components/seguimiento-pedido";

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

      <SeguimientoPedido
        pedidoId={pedido.id}
        comercioId={pedido.comercio_id}
        comercioNombre={comercio?.nombre ?? "El Comercio"}
        inicial={{
          estado: pedido.estado,
          modalidad: pedido.modalidad,
          motivo_cancelacion: pedido.motivo_cancelacion,
          tracking_lat: pedido.tracking_lat,
          tracking_lng: pedido.tracking_lng,
        }}
        destinoLat={
          (pedido.direccion_entrega as { lat?: number } | null)?.lat ?? null
        }
        destinoLng={
          (pedido.direccion_entrega as { lng?: number } | null)?.lng ?? null
        }
      />

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
