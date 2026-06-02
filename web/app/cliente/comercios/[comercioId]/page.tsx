import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { CatalogoList, type ProductoCliente } from "./_components/catalogo-list";

export default async function ComercioDetallePage({
  params,
}: {
  params: Promise<{ comercioId: string }>;
}) {
  const { comercioId } = await params;
  const admin = createAdminClient();

  const { data: comercio } = await admin
    .from("comercios")
    .select("id, nombre, direccion, activo")
    .eq("id", comercioId)
    .maybeSingle();

  if (!comercio || !comercio.activo) notFound();

  const { data: productos } = await admin
    .from("productos")
    .select("id, nombre, descripcion, precio_cop, foto_url, disponible")
    .eq("comercio_id", comercioId)
    .eq("disponible", true)
    .order("created_at", { ascending: true });

  const productoIds = (productos ?? []).map((p) => p.id);
  let adicionesMap: Record<string, { id: string; nombre: string; precio_adicional: number }[]> = {};
  if (productoIds.length > 0) {
    const { data: adiciones } = await admin
      .from("adiciones_estructuradas")
      .select("id, nombre, precio_adicional, producto_id")
      .in("producto_id", productoIds);
    adicionesMap = (adiciones ?? []).reduce<typeof adicionesMap>((acc, a) => {
      const list = acc[a.producto_id] ?? [];
      list.push({ id: a.id, nombre: a.nombre, precio_adicional: a.precio_adicional });
      acc[a.producto_id] = list;
      return acc;
    }, {});
  }

  const productosUI: ProductoCliente[] = (productos ?? []).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio_cop: p.precio_cop,
    foto_url: p.foto_url,
    adiciones: adicionesMap[p.id] ?? [],
  }));

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/cliente"
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          ← Volver
        </Link>
      </div>
      <h1 className="text-2xl font-bold">{comercio.nombre}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{comercio.direccion}</p>

      <div className="mt-6">
        <CatalogoList
          comercioId={comercio.id}
          comercioNombre={comercio.nombre}
          productos={productosUI}
        />
      </div>
    </div>
  );
}
