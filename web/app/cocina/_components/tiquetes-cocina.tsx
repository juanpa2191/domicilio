"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { marcarListoCocina } from "../actions";

type Adicion = { nombre: string; precio_adicional: number };

export type TiqueteItem = {
  id: string;
  cantidad: number;
  nombre_snapshot: string;
  adiciones_seleccionadas: Adicion[];
};

export type Tiquete = {
  id: string;
  sequence_number: number;
  modalidad: "domicilio" | "recoger_en_local";
  adicion_libre: string | null;
  created_at: string;
  items: TiqueteItem[];
};

type RealtimeStatus = "realtime" | "polling" | "conectando";

export function TiquetesCocina({
  comercioId,
  initialTiquetes,
}: {
  comercioId: string;
  initialTiquetes: Tiquete[];
}) {
  const [tiquetes, setTiquetes] = useState<Tiquete[]>(initialTiquetes);
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<RealtimeStatus>("conectando");
  const [confirmar, setConfirmar] = useState<Tiquete | null>(null);
  const [isPending, startTransition] = useTransition();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`cocina:${comercioId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `comercio_id=eq.${comercioId}`,
        },
        async (payload) => {
          const nuevo = payload.new as { id: string; estado: string };
          const viejo = payload.old as { id: string; estado: string };

          // Entró a en_cocina (Mostrador confirmó pago) → hidratar y agregar
          if (nuevo.estado === "en_cocina" && viejo.estado !== "en_cocina") {
            const hidratado = await fetchTiqueteCompleto(nuevo.id);
            if (hidratado) {
              setTiquetes((prev) =>
                prev.some((t) => t.id === hidratado.id) ? prev : [...prev, hidratado]
              );
            }
          }

          // Salió de en_cocina (listo, cancelado, etc) → fade-out y quitar
          if (viejo.estado === "en_cocina" && nuevo.estado !== "en_cocina") {
            setFadingOut((prev) => new Set(prev).add(nuevo.id));
            setTimeout(() => {
              setTiquetes((prev) => prev.filter((t) => t.id !== nuevo.id));
              setFadingOut((prev) => {
                const next = new Set(prev);
                next.delete(nuevo.id);
                return next;
              });
            }, 200);
          }
        }
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          setStatus("realtime");
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          activarPolling();
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comercioId]);

  function activarPolling() {
    if (pollIntervalRef.current) return;
    setStatus("polling");
    pollIntervalRef.current = setInterval(async () => {
      const fresh = await fetchTiquetesCocina(comercioId);
      if (fresh) setTiquetes(fresh);
    }, 10000);
  }

  function handleMarcarListo() {
    if (!confirmar) return;
    const tiquete = confirmar;
    setConfirmar(null);
    setFadingOut((prev) => new Set(prev).add(tiquete.id));
    startTransition(async () => {
      const result = await marcarListoCocina(tiquete.id);
      if (!result.success) {
        toast.error(result.error);
        setFadingOut((prev) => {
          const next = new Set(prev);
          next.delete(tiquete.id);
          return next;
        });
        return;
      }
      toast.success(`Pedido #${tiquete.sequence_number} listo ✓`);
      // El fade-out + remoción real se hará por el evento Realtime UPDATE
      // pero aplicamos uno local en caso de polling
      setTimeout(() => {
        setTiquetes((prev) => prev.filter((t) => t.id !== tiquete.id));
        setFadingOut((prev) => {
          const next = new Set(prev);
          next.delete(tiquete.id);
          return next;
        });
      }, 200);
    });
  }

  const ordenados = [...tiquetes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="flex flex-col gap-3">
      <StatusIndicator status={status} />

      {ordenados.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-16 text-center">
          <p className="text-2xl text-zinc-400">Sin pedidos en cocina.</p>
          <p className="mt-2 text-base text-zinc-500">Buen momento para tomar agua. 💧</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordenados.map((t) => (
            <li key={t.id}>
              <TiqueteCard
                tiquete={t}
                fadingOut={fadingOut.has(t.id)}
                onClick={() => setConfirmar(t)}
              />
            </li>
          ))}
        </ul>
      )}

      {confirmar && (
        <ConfirmListoModal
          tiquete={confirmar}
          isPending={isPending}
          onConfirmar={handleMarcarListo}
          onCancelar={() => setConfirmar(null)}
        />
      )}
    </div>
  );
}

function StatusIndicator({ status }: { status: RealtimeStatus }) {
  if (status === "realtime") {
    return (
      <div className="text-xs text-zinc-600">
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
        Conectado
      </div>
    );
  }
  if (status === "polling") {
    return (
      <div className="text-xs text-amber-500">
        <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />
        Modo polling (sin tiempo real). Actualizando cada 10s.
      </div>
    );
  }
  return (
    <div className="text-xs text-zinc-500">
      <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-500" />
      Conectando...
    </div>
  );
}

function TiqueteCard({
  tiquete,
  fadingOut,
  onClick,
}: {
  tiquete: Tiquete;
  fadingOut: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border-2 border-zinc-700 bg-zinc-900 p-5 text-left transition-opacity duration-200 hover:border-zinc-500 active:bg-zinc-800 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ minHeight: 80 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-3xl font-bold text-zinc-50">#{tiquete.sequence_number}</span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
            tiquete.modalidad === "domicilio"
              ? "bg-blue-900/50 text-blue-200"
              : "bg-purple-900/50 text-purple-200"
          }`}
        >
          {tiquete.modalidad === "domicilio" ? "Para domicilio" : "Para recoger"}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {tiquete.items.map((it) => (
          <li key={it.id}>
            <p className="text-2xl font-bold leading-tight text-zinc-50">
              {it.cantidad}× {it.nombre_snapshot}
            </p>
            {it.adiciones_seleccionadas && it.adiciones_seleccionadas.length > 0 && (
              <p className="ml-6 text-xl leading-snug text-zinc-300">
                + {it.adiciones_seleccionadas.map((a) => a.nombre).join(", ")}
              </p>
            )}
          </li>
        ))}
      </ul>

      {tiquete.adicion_libre && (
        <div className="mt-3 rounded-md border border-amber-700/50 bg-amber-900/20 p-3">
          <p className="text-xs uppercase tracking-wide text-amber-400">Nota del cliente</p>
          <p className="mt-1 text-xl italic text-amber-100">&quot;{tiquete.adicion_libre}&quot;</p>
        </div>
      )}
    </button>
  );
}

function ConfirmListoModal({
  tiquete,
  isPending,
  onConfirmar,
  onCancelar,
}: {
  tiquete: Tiquete;
  isPending: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const titulo =
    tiquete.items.length === 1
      ? tiquete.items[0].nombre_snapshot
      : `Pedido #${tiquete.sequence_number}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-900 p-6">
        <p className="text-center text-2xl font-bold text-zinc-50">¿Listo el {titulo}?</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onConfirmar}
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-6 text-2xl font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
            style={{ minHeight: 80 }}
          >
            Sí, listo ✓
          </button>
          <button
            type="button"
            onClick={onCancelar}
            disabled={isPending}
            className="rounded-lg border-2 border-zinc-700 px-6 text-xl text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-60"
            style={{ minHeight: 64 }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

async function fetchTiquetesCocina(comercioId: string): Promise<Tiquete[] | null> {
  const supabase = createClient();
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, sequence_number, modalidad, adicion_libre, created_at")
    .eq("comercio_id", comercioId)
    .eq("estado", "en_cocina")
    .order("created_at", { ascending: true });
  if (!pedidos) return null;
  const ids = pedidos.map((p) => p.id);
  if (ids.length === 0) return [];
  const { data: items } = await supabase
    .from("items_pedido")
    .select("id, pedido_id, cantidad, nombre_snapshot, adiciones_seleccionadas")
    .in("pedido_id", ids);
  return pedidos.map((p) => ({
    id: p.id,
    sequence_number: p.sequence_number,
    modalidad: p.modalidad,
    adicion_libre: p.adicion_libre,
    created_at: p.created_at,
    items: (items ?? [])
      .filter((it) => it.pedido_id === p.id)
      .map((it) => ({
        id: it.id,
        cantidad: it.cantidad,
        nombre_snapshot: it.nombre_snapshot,
        adiciones_seleccionadas: (it.adiciones_seleccionadas as Adicion[]) ?? [],
      })),
  }));
}

async function fetchTiqueteCompleto(pedidoId: string): Promise<Tiquete | null> {
  const supabase = createClient();
  const { data: p } = await supabase
    .from("pedidos")
    .select("id, sequence_number, modalidad, adicion_libre, created_at, estado")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!p || p.estado !== "en_cocina") return null;
  const { data: items } = await supabase
    .from("items_pedido")
    .select("id, cantidad, nombre_snapshot, adiciones_seleccionadas")
    .eq("pedido_id", pedidoId);
  return {
    id: p.id,
    sequence_number: p.sequence_number,
    modalidad: p.modalidad,
    adicion_libre: p.adicion_libre,
    created_at: p.created_at,
    items: (items ?? []).map((it) => ({
      id: it.id,
      cantidad: it.cantidad,
      nombre_snapshot: it.nombre_snapshot,
      adiciones_seleccionadas: (it.adiciones_seleccionadas as Adicion[]) ?? [],
    })),
  };
}
