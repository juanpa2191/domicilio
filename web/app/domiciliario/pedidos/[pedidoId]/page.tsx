import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatearCOP } from "@/lib/domicilios/precio";
import { EntregaDetalle, type EntregaDetalleData } from "./_components/entrega-detalle";

export const dynamic = "force-dynamic";

export default async function DomiciliarioPedidoPage({
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
  const { data: dom } = await admin
    .from("domiciliarios")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!dom) redirect("/");

  const { data: pedido } = await admin
    .from("pedidos")
    .select(
      "id, sequence_number, total_cop, estado, modalidad, forma_pago, cliente_id, direccion_entrega, adicion_libre, domiciliario_id, tracking_lat, tracking_lng"
    )
    .eq("id", pedidoId)
    .maybeSingle();
  if (!pedido) notFound();
  if (pedido.domiciliario_id !== dom.id) notFound();

  const [{ data: items }, { data: perfil }] = await Promise.all([
    admin
      .from("items_pedido")
      .select("id, nombre_snapshot, cantidad, adiciones_seleccionadas, subtotal_cop")
      .eq("pedido_id", pedido.id),
    admin
      .from("perfiles_cliente")
      .select("nombre, celular")
      .eq("user_id", pedido.cliente_id)
      .maybeSingle(),
  ]);

  const direccion = pedido.direccion_entrega as
    | { direccion: string; alias?: string | null; lat?: number; lng?: number }
    | null;

  const data: EntregaDetalleData = {
    id: pedido.id,
    sequence_number: pedido.sequence_number,
    total_cop: pedido.total_cop,
    estado: pedido.estado,
    forma_pago: pedido.forma_pago,
    cliente_nombre: perfil?.nombre ?? "Cliente",
    cliente_celular: perfil?.celular ?? null,
    direccion: direccion?.direccion ?? "Sin dirección",
    direccion_alias: direccion?.alias ?? null,
    destino_lat: direccion?.lat ?? null,
    destino_lng: direccion?.lng ?? null,
    tracking_lat: pedido.tracking_lat,
    tracking_lng: pedido.tracking_lng,
    adicion_libre: pedido.adicion_libre,
    items: (items ?? []).map((it) => ({
      id: it.id,
      cantidad: it.cantidad,
      nombre_snapshot: it.nombre_snapshot,
      adiciones_seleccionadas: (it.adiciones_seleccionadas as { nombre: string }[]) ?? [],
      subtotal_cop: it.subtotal_cop,
    })),
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/domiciliario"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Mis entregas
        </Link>
        <h1 className="mt-2 text-xl font-bold">Pedido #{data.sequence_number}</h1>
      </div>

      <EntregaDetalle data={data} />

      {/* Resumen items */}
      <div className="rounded-lg border bg-white p-4">
        <p className="mb-2 text-sm font-semibold">Resumen</p>
        <ul className="flex flex-col gap-1 text-sm">
          {data.items.map((it) => (
            <li key={it.id} className="flex justify-between gap-2">
              <span>
                <span className="font-medium">{it.cantidad}×</span> {it.nombre_snapshot}
                {it.adiciones_seleccionadas.length > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    + {it.adiciones_seleccionadas.map((a) => a.nombre).join(", ")}
                  </span>
                )}
              </span>
              <span className="font-mono text-xs">{formatearCOP(it.subtotal_cop)}</span>
            </li>
          ))}
        </ul>
        {data.adicion_libre && (
          <p className="mt-2 rounded-md bg-muted p-2 text-xs italic">
            &quot;{data.adicion_libre}&quot;
          </p>
        )}
        <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold">
          <span>Total a cobrar</span>
          <span>{formatearCOP(data.total_cop)}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Forma de pago: <span className="capitalize">{data.forma_pago.replace("_", " ")}</span>
        </p>
      </div>
    </div>
  );
}
