import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductoForm } from "../../_components/producto-form";
import { AdicionesCard } from "./_components/adiciones-card";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ productoId: string }>;
}) {
  const { productoId } = await params;

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
  const { data: producto } = await admin
    .from("productos")
    .select("id, comercio_id, nombre, descripcion, precio_cop, foto_url, disponible")
    .eq("id", productoId)
    .maybeSingle();

  if (!producto) notFound();
  if (producto.comercio_id !== mostradorRow.comercio_id) notFound();

  const { data: adiciones } = await admin
    .from("adiciones_estructuradas")
    .select("id, nombre, precio_adicional")
    .eq("producto_id", productoId)
    .order("created_at", { ascending: true });

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/mostrador/catalogo"
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          ← Volver al Catálogo
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-bold">Editar producto</h1>

      <div className="flex flex-col gap-6">
        <ProductoForm
          mode={{ kind: "editar", productoId: producto.id, comercioId: mostradorRow.comercio_id }}
          initial={{
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio_cop: producto.precio_cop,
            foto_url: producto.foto_url,
            disponible: producto.disponible,
          }}
        />

        <AdicionesCard productoId={producto.id} initial={adiciones ?? []} />
      </div>
    </div>
  );
}
