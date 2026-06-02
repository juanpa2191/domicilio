import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  FORMAS_PAGO_VACIAS,
  type FormasPago,
} from "@/lib/domicilios/schemas/formas-pago";
import { PagosForm } from "./_components/pagos-form";
import { ConfigTabs } from "../_components/config-tabs";

export default async function PagosPage() {
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

  if (!mostradorRow) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-muted-foreground">
          No estás vinculado a ningún Comercio.
        </p>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: comercio } = await admin
    .from("comercios")
    .select("formas_pago")
    .eq("id", mostradorRow.comercio_id)
    .single();

  const formasPago =
    comercio?.formas_pago && typeof comercio.formas_pago === "object"
      ? ({ ...FORMAS_PAGO_VACIAS, ...(comercio.formas_pago as Partial<FormasPago>) } as FormasPago)
      : FORMAS_PAGO_VACIAS;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Configuración del Comercio</h1>
      <ConfigTabs />
      <p className="mb-6 text-sm text-muted-foreground">
        Activa las formas de pago que aceptas. El Cliente solo verá las que
        estén activas al confirmar su pedido.
      </p>

      <PagosForm initial={formasPago} />
    </div>
  );
}
