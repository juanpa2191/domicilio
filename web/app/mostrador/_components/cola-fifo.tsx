"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatearCOP } from "@/lib/domicilios/precio";
import { ESTADO_META, tiempoTranscurrido, type EstadoPedido } from "@/lib/domicilios/estado-pedido";

export type PedidoCola = {
  id: string;
  sequence_number: number;
  estado: EstadoPedido;
  modalidad: "domicilio" | "recoger_en_local";
  forma_pago: "transferencia" | "efectivo_recibir" | "efectivo_local";
  total_cop: number;
  created_at: string;
  adicion_libre: string | null;
};

const ESTADOS_ACTIVOS: EstadoPedido[] = [
  "pendiente_pago",
  "validando_pago",
  "en_cocina",
  "listo",
  "en_domicilio",
];

export function ColaFifo({
  comercioId,
  initialPedidos,
}: {
  comercioId: string;
  initialPedidos: PedidoCola[];
}) {
  const [pedidos, setPedidos] = useState<PedidoCola[]>(initialPedidos);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [filtro, setFiltro] = useState<"activos" | EstadoPedido>("activos");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // refresca tiempos cada 30s para que "tiempoTranscurrido" se vea fresco
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`pedidos:comercio:${comercioId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pedidos",
          filter: `comercio_id=eq.${comercioId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const nuevo = payload.new as PedidoCola;
            setPedidos((prev) => [nuevo, ...prev]);
            setHighlighted((prev) => new Set(prev).add(nuevo.id));
            audioRef.current?.play().catch(() => {});
            // Quitar highlight después de 5s
            setTimeout(() => {
              setHighlighted((prev) => {
                const next = new Set(prev);
                next.delete(nuevo.id);
                return next;
              });
            }, 5000);
          } else if (payload.eventType === "UPDATE") {
            const actualizado = payload.new as PedidoCola;
            setPedidos((prev) =>
              prev.map((p) => (p.id === actualizado.id ? { ...p, ...actualizado } : p))
            );
          } else if (payload.eventType === "DELETE") {
            const eliminado = payload.old as { id: string };
            setPedidos((prev) => prev.filter((p) => p.id !== eliminado.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [comercioId]);

  const filtrados =
    filtro === "activos"
      ? pedidos.filter((p) => ESTADOS_ACTIVOS.includes(p.estado))
      : pedidos.filter((p) => p.estado === filtro);

  // Orden FIFO: más viejo arriba (sequence_number ascendente)
  const ordenados = [...filtrados].sort((a, b) => a.sequence_number - b.sequence_number);

  return (
    <div className="flex flex-col gap-4">
      {/* Audio para alerta de nuevo pedido — usa un beep corto en base64 */}
      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAA"
        preload="auto"
      />

      <FiltroTabs filtro={filtro} onChange={setFiltro} pedidos={pedidos} />

      {ordenados.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          Sin pedidos {filtro === "activos" ? "activos" : `en estado "${ESTADO_META[filtro as EstadoPedido].label.toLowerCase()}"`}.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordenados.map((p) => (
            <li key={p.id}>
              <PedidoCard
                pedido={p}
                highlighted={highlighted.has(p.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FiltroTabs({
  filtro,
  onChange,
  pedidos,
}: {
  filtro: "activos" | EstadoPedido;
  onChange: (v: "activos" | EstadoPedido) => void;
  pedidos: PedidoCola[];
}) {
  const opciones: { value: "activos" | EstadoPedido; label: string }[] = [
    { value: "activos", label: "Activos" },
    { value: "validando_pago", label: "Validando" },
    { value: "en_cocina", label: "En cocina" },
    { value: "listo", label: "Listo" },
    { value: "en_domicilio", label: "En camino" },
    { value: "entregado", label: "Entregado" },
    { value: "cancelado", label: "Cancelado" },
  ];

  function count(v: "activos" | EstadoPedido): number {
    if (v === "activos") return pedidos.filter((p) => ESTADOS_ACTIVOS.includes(p.estado)).length;
    return pedidos.filter((p) => p.estado === v).length;
  }

  return (
    <nav className="flex flex-wrap gap-1 border-b text-sm">
      {opciones.map((o) => {
        const active = filtro === o.value;
        const c = count(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 font-medium transition-colors ${
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
            {c > 0 && (
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {c}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

function PedidoCard({
  pedido,
  highlighted,
}: {
  pedido: PedidoCola;
  highlighted: boolean;
}) {
  const meta = ESTADO_META[pedido.estado];
  return (
    <Link href={`/mostrador/pedidos/${pedido.id}`}>
      <Card
        className={`transition-all ${
          highlighted
            ? "border-primary ring-2 ring-primary/40 bg-primary/5 animate-in slide-in-from-bottom-2"
            : "hover:bg-muted/30"
        }`}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-12 w-12 flex-col items-center justify-center rounded-md border bg-muted text-center">
            <span className="text-xs text-muted-foreground">#</span>
            <span className="text-sm font-bold">{pedido.sequence_number}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`text-xs ${meta.className}`}>{meta.label}</Badge>
              <span className="text-xs text-muted-foreground capitalize">
                {pedido.modalidad.replace("_", " ")}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                · {pedido.forma_pago.replace("_", " ")}
              </span>
            </div>
            {pedido.adicion_libre && (
              <p className="line-clamp-1 mt-1 text-xs italic text-muted-foreground">
                &quot;{pedido.adicion_libre}&quot;
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {tiempoTranscurrido(pedido.created_at)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">{formatearCOP(pedido.total_cop)}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
