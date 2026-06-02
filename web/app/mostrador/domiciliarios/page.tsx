import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DomiciliariosSection } from "./_components/domiciliarios-section";

export default async function DomiciliariosPage() {
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
  if (!mostradorRow) return null;

  const admin = createAdminClient();
  const { data: items } = await admin
    .from("domiciliarios")
    .select("id, nombre, celular, email, activo")
    .eq("comercio_id", mostradorRow.comercio_id)
    .order("created_at", { ascending: true });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Domiciliarios</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Contactos del personal que entrega los pedidos. Usados para coordinar
        entregas vía WhatsApp/llamada.
      </p>

      <DomiciliariosSection initial={items ?? []} />
    </div>
  );
}
