import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { ProductoRow } from "./_components/producto-row";

export default async function CatalogoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: mostradorRow } = await supabase
    .from("usuarios_comercio")
    .select("comercio_id")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!mostradorRow) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <p className="text-sm text-muted-foreground">No estás vinculado a un Comercio.</p>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: productos } = await admin
    .from("productos")
    .select("id, nombre, descripcion, precio_cop, foto_url, disponible")
    .eq("comercio_id", mostradorRow.comercio_id)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Catálogo</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Productos visibles para el Cliente al pedirte.
          </p>
        </div>
        <Button asChild>
          <Link href="/mostrador/catalogo/productos/nuevo">+ Nuevo producto</Link>
        </Button>
      </div>

      {!productos || productos.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no tienes productos. Crea el primero.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {productos.map((p) => (
            <ProductoRow key={p.id} {...p} />
          ))}
        </ul>
      )}
    </div>
  );
}
