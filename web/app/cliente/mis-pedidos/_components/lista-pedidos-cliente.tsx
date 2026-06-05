"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatearCOP } from "@/lib/domicilios/precio";

type Estado =
  | "pendiente_pago"
  | "validando_pago"
  | "en_cocina"
  | "listo"
  | "en_domicilio"
  | "entregado"
  | "cancelado";

const ESTADO_LABEL: Record<Estado, { label: string; tono: string }> = {
  pendiente_pago: { label: "Pendiente de pago", tono: "bg-amber-100 text-amber-900 border-amber-200" },
  validando_pago: { label: "Validando pago", tono: "bg-amber-100 text-amber-900 border-amber-200" },
  en_cocina: { label: "En cocina", tono: "bg-orange-100 text-orange-900 border-orange-200" },
  listo: { label: "Listo", tono: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  en_domicilio: { label: "En camino", tono: "bg-blue-100 text-blue-900 border-blue-200" },
  entregado: { label: "Entregado", tono: "bg-slate-100 text-slate-700 border-slate-200" },
  cancelado: { label: "Cancelado", tono: "bg-red-100 text-red-900 border-red-200" },
};

const ACTIVOS: Estado[] = [
  "pendiente_pago",
  "validando_pago",
  "en_cocina",
  "listo",
  "en_domicilio",
];

export type PedidoRow = {
  id: string;
  sequence_number: number;
  estado: Estado;
  total_cop: number;
  comercio_id: string;
  created_at: string;
  modalidad: "domicilio" | "recoger_en_local";
};

export function ListaPedidosCliente({
  clienteId,
  inicialPedidos,
  inicialComercios,
}: {
  clienteId: string;
  inicialPedidos: PedidoRow[];
  inicialComercios: Record<string, string>;
}) {
  const [pedidos, setPedidos] = useState<PedidoRow[]>(inicialPedidos);
  const [comercios, setComercios] = useState<Record<string, string>>(inicialComercios);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`cliente:pedidos:${clienteId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `cliente_id=eq.${clienteId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const nuevo = payload.new as PedidoRow;
            setPedidos((prev) =>
              prev.some((p) => p.id === nuevo.id) ? prev : [nuevo, ...prev]
            );
            if (!comercios[nuevo.comercio_id]) {
              const { data } = await supabase
                .from("comercios")
                .select("nombre")
                .eq("id", nuevo.comercio_id)
                .maybeSingle();
              if (data?.nombre) {
                setComercios((m) => ({ ...m, [nuevo.comercio_id]: data.nombre }));
              }
            }
            setHighlighted((prev) => new Set(prev).add(nuevo.id));
            setTimeout(() => {
              setHighlighted((prev) => {
                const next = new Set(prev);
                next.delete(nuevo.id);
                return next;
              });
            }, 2500);
          } else if (payload.eventType === "UPDATE") {
            const actualizado = payload.new as PedidoRow;
            setPedidos((prev) =>
              prev.map((p) => (p.id === actualizado.id ? { ...p, ...actualizado } : p))
            );
            setHighlighted((prev) => new Set(prev).add(actualizado.id));
            setTimeout(() => {
              setHighlighted((prev) => {
                const next = new Set(prev);
                next.delete(actualizado.id);
                return next;
              });
            }, 1500);
          } else if (payload.eventType === "DELETE") {
            const eliminado = payload.old as { id: string };
            setPedidos((prev) => prev.filter((p) => p.id !== eliminado.id));
          }
        }
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          startPolling();
        }
      });

    function startPolling() {
      if (pollRef.current) return;
      pollRef.current = setInterval(async () => {
        const treintaDias = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();
        const { data } = await supabase
          .from("pedidos")
          .select(
            "id, sequence_number, estado, total_cop, comercio_id, created_at, modalidad"
          )
          .eq("cliente_id", clienteId)
          .gte("created_at", treintaDias)
          .order("created_at", { ascending: false })
          .limit(50);
        if (data) setPedidos(data as PedidoRow[]);
      }, 10000);
    }

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const ordenados = [...pedidos].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const activos = ordenados.filter((p) => ACTIVOS.includes(p.estado));
  const historial = ordenados.filter((p) => !ACTIVOS.includes(p.estado));

  return (
    <>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Activos {activos.length > 0 && `(${activos.length}/3)`}
        </h2>
        {activos.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Sin pedidos activos.{" "}
            <Link href="/cliente" className="text-primary underline-offset-4 hover:underline">
              Ver comercios →
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {activos.map((p) => (
              <PedidoCard
                key={p.id}
                pedido={p}
                comercio={comercios[p.comercio_id]}
                highlighted={highlighted.has(p.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Historial (últimos 30 días)
        </h2>
        {historial.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aún no tienes pedidos en historial.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {historial.map((p) => (
              <PedidoCard
                key={p.id}
                pedido={p}
                comercio={comercios[p.comercio_id]}
                highlighted={highlighted.has(p.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function PedidoCard({
  pedido,
  comercio,
  highlighted,
}: {
  pedido: PedidoRow;
  comercio: string | undefined;
  highlighted: boolean;
}) {
  const meta = ESTADO_LABEL[pedido.estado];
  return (
    <li>
      <Link href={`/cliente/pedidos/${pedido.id}`}>
        <Card
          className={`transition-all ${
            highlighted
              ? "border-primary ring-2 ring-primary/40 bg-primary/5"
              : "hover:bg-muted/30"
          }`}
        >
          <CardContent className="flex items-center justify-between p-3">
            <div>
              <p className="font-medium">{comercio ?? "Comercio"}</p>
              <p className="text-xs text-muted-foreground">
                #{pedido.sequence_number} ·{" "}
                {new Date(pedido.created_at).toLocaleString("es-CO", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge className={`text-xs ${meta.tono}`}>{meta.label}</Badge>
              <span className="text-sm font-semibold">{formatearCOP(pedido.total_cop)}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </li>
  );
}
