import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductoForm } from "../../_components/producto-form";

export default async function NuevoProductoPage() {
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
      <h1 className="mb-6 text-2xl font-bold">Nuevo producto</h1>
      <ProductoForm
        mode={{ kind: "nuevo", comercioId: mostradorRow.comercio_id }}
        initial={{
          nombre: "",
          descripcion: null,
          precio_cop: 0,
          foto_url: null,
          disponible: true,
        }}
      />
    </div>
  );
}
