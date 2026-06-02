"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/store";
import { createClient } from "@/lib/supabase/client";
import { CheckoutForm } from "./_components/checkout-form";

const FORMAS_PAGO_DEFAULT = {
  nequi: { activo: false },
  bancolombia: { activo: false },
  daviplata: { activo: false },
  efectivo_recibir: { activo: false },
  efectivo_local: { activo: false },
};

type FormasPago = typeof FORMAS_PAGO_DEFAULT;

export default function CheckoutPage() {
  const router = useRouter();
  const comercioId = useCart((s) => s.comercio_id);
  const items = useCart((s) => s.items);
  const [formasPago, setFormasPago] = useState<FormasPago | null>(null);
  const [perfilCelular, setPerfilCelular] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!comercioId || items.length === 0) {
      router.replace("/cliente/carrito");
      return;
    }
    (async () => {
      const sb = createClient();
      const [{ data: comercio }, { data: userResp }] = await Promise.all([
        sb.from("comercios").select("formas_pago").eq("id", comercioId).maybeSingle(),
        sb.auth.getUser(),
      ]);

      const incoming = (comercio?.formas_pago as Partial<FormasPago> | null) ?? null;
      setFormasPago({ ...FORMAS_PAGO_DEFAULT, ...(incoming ?? {}) });

      if (userResp.user) {
        const { data: perfil } = await sb
          .from("perfiles_cliente")
          .select("celular")
          .eq("user_id", userResp.user.id)
          .maybeSingle();
        setPerfilCelular(perfil?.celular ?? null);
      } else {
        setPerfilCelular(null);
      }
    })();
  }, [comercioId, items.length, router]);

  if (!formasPago || perfilCelular === undefined) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Cargando…</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Confirmar pedido</h1>
      <CheckoutForm
        comercioId={comercioId!}
        formasPago={formasPago}
        perfilCelular={perfilCelular}
      />
    </div>
  );
}
