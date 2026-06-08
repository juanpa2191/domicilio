"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoogleMapView, type MapMarker } from "@/components/domicilios/google-map";

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

function TrackingMap({
  destinoLat,
  destinoLng,
  trackingLat,
  trackingLng,
}: {
  destinoLat: number;
  destinoLng: number;
  trackingLat: number;
  trackingLng: number;
}) {
  const markers: MapMarker[] = [
    { id: "destino", lat: destinoLat, lng: destinoLng, label: "Tu casa", color: "red" },
    { id: "domiciliario", lat: trackingLat, lng: trackingLng, label: "Domiciliario", color: "blue" },
  ];
  return <GoogleMapView markers={markers} height={280} />;
}

function mensajeContextual(
  estado: Estado,
  modalidad: "domicilio" | "recoger_en_local",
  comercio: string
): string {
  switch (estado) {
    case "pendiente_pago":
      return "Sube tu comprobante para que el Comercio valide el pago.";
    case "validando_pago":
      return `${comercio} está validando tu pago. Te avisamos cuando confirmen.`;
    case "en_cocina":
      return `${comercio} confirmó tu pago. Tu pedido está en cocina.`;
    case "listo":
      return modalidad === "domicilio"
        ? "¡Ya está listo! Sale pronto en domicilio."
        : "¡Ya está listo! Pasa a recogerlo cuando puedas.";
    case "en_domicilio":
      return "Tu pedido va en camino. ¡Ya casi!";
    case "entregado":
      return "Pedido entregado. ¡Buen provecho! 😋";
    case "cancelado":
      return "El pedido fue cancelado.";
  }
}

type PedidoState = {
  estado: Estado;
  modalidad: "domicilio" | "recoger_en_local";
  motivo_cancelacion: string | null;
  tracking_lat: number | null;
  tracking_lng: number | null;
};

export function SeguimientoPedido({
  pedidoId,
  comercioNombre,
  inicial,
  comercioId,
  destinoLat,
  destinoLng,
}: {
  pedidoId: string;
  comercioId: string;
  comercioNombre: string;
  inicial: PedidoState;
  destinoLat: number | null;
  destinoLng: number | null;
}) {
  const [state, setState] = useState<PedidoState>(inicial);
  const [justChanged, setJustChanged] = useState(false);
  const prevEstadoRef = useRef<Estado>(inicial.estado);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`cliente:pedido:${pedidoId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `id=eq.${pedidoId}`,
        },
        (payload) => {
          const nuevo = payload.new as PedidoState;
          aplicar(nuevo);
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
        const { data } = await supabase
          .from("pedidos")
          .select("estado, modalidad, motivo_cancelacion, tracking_lat, tracking_lng")
          .eq("id", pedidoId)
          .maybeSingle();
        if (data) aplicar(data as PedidoState);
      }, 10000);
    }

    function aplicar(nuevo: PedidoState) {
      setState((prev) => {
        if (prev.estado !== nuevo.estado) {
          setJustChanged(true);
          setTimeout(() => setJustChanged(false), 1500);
        }
        return nuevo;
      });
      prevEstadoRef.current = nuevo.estado;
    }

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pedidoId]);

  const meta = ESTADO_LABEL[state.estado];
  const mensaje = mensajeContextual(state.estado, state.modalidad, comercioNombre);

  return (
    <div className="flex flex-col gap-3">
      <Badge
        className={`w-fit text-sm transition-transform ${meta.tono} ${
          justChanged ? "scale-110" : "scale-100"
        }`}
      >
        {meta.label}
      </Badge>

      <Card
        className={`transition-colors ${
          justChanged ? "border-primary bg-primary/5" : ""
        }`}
      >
        <CardContent className="p-4 text-sm">
          <p>{mensaje}</p>

          {state.estado === "pendiente_pago" && (
            <Link
              href={`/cliente/pedidos/${pedidoId}/subir-comprobante`}
              className="mt-2 inline-block font-medium text-primary underline-offset-4 hover:underline"
            >
              Subir comprobante →
            </Link>
          )}

          {state.estado === "cancelado" && state.motivo_cancelacion && (
            <p className="mt-2 text-xs italic text-muted-foreground">
              Motivo: {state.motivo_cancelacion}
            </p>
          )}

          {state.estado === "cancelado" && (
            <Link
              href={`/cliente/comercios/${comercioId}`}
              className="mt-2 inline-block font-medium text-primary underline-offset-4 hover:underline"
            >
              Pedir de nuevo →
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Tracking en vivo cuando va en camino */}
      {state.estado === "en_domicilio" && destinoLat != null && destinoLng != null && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Tu Domiciliario en vivo</p>
          {state.tracking_lat == null ? (
            <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
              Esperando que el Domiciliario comparta su ubicación...
            </div>
          ) : (
            <TrackingMap
              destinoLat={destinoLat}
              destinoLng={destinoLng}
              trackingLat={state.tracking_lat}
              trackingLng={state.tracking_lng!}
            />
          )}
        </div>
      )}
    </div>
  );
}
