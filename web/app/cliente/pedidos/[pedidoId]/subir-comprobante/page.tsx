import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubirComprobanteForm } from "./_components/subir-comprobante-form";

const FORMAS_PAGO_DEFAULT = {
  nequi: { activo: false, celular: null as string | null },
  bancolombia: { activo: false, cuenta: null as string | null, tipo: null as string | null },
  daviplata: { activo: false, celular: null as string | null },
};

export default async function SubirComprobantePage({
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
    .select("id, cliente_id, comercio_id, total_cop, estado")
    .eq("id", pedidoId)
    .maybeSingle();

  if (!pedido) notFound();
  if (pedido.cliente_id !== user.id) notFound();
  if (pedido.estado !== "pendiente_pago") {
    redirect(`/cliente/pedidos/${pedidoId}`);
  }

  const { data: comercio } = await admin
    .from("comercios")
    .select("nombre, formas_pago")
    .eq("id", pedido.comercio_id)
    .single();

  const incoming = (comercio?.formas_pago as Partial<typeof FORMAS_PAGO_DEFAULT> | null) ?? null;
  const formasPago = { ...FORMAS_PAGO_DEFAULT, ...(incoming ?? {}) };

  return (
    <div>
      <h1 className="text-2xl font-bold">Sube tu comprobante</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Para que {comercio?.nombre} pueda confirmar tu pedido.
      </p>

      <div className="mt-6">
        <SubirComprobanteForm
          pedidoId={pedido.id}
          userId={user.id}
          comercioNombre={comercio?.nombre ?? ""}
          formasPago={formasPago}
          totalCop={pedido.total_cop}
        />
      </div>
    </div>
  );
}
