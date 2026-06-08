"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GoogleMapView, type MapMarker } from "@/components/domicilios/google-map";
import {
  actualizarUbicacionDomiciliario,
  marcarEntregadoDomiciliario,
} from "../../../actions";

export type EntregaDetalleData = {
  id: string;
  sequence_number: number;
  total_cop: number;
  estado: string;
  forma_pago: string;
  cliente_nombre: string;
  cliente_celular: string | null;
  direccion: string;
  direccion_alias: string | null;
  destino_lat: number | null;
  destino_lng: number | null;
  tracking_lat: number | null;
  tracking_lng: number | null;
  adicion_libre: string | null;
  items: {
    id: string;
    cantidad: number;
    nombre_snapshot: string;
    adiciones_seleccionadas: { nombre: string }[];
    subtotal_cop: number;
  }[];
};

const PING_INTERVAL_MS = 30_000;

export function EntregaDetalle({ data }: { data: EntregaDetalleData }) {
  const [yo, setYo] = useState<{ lat: number; lng: number } | null>(
    data.tracking_lat && data.tracking_lng
      ? { lat: data.tracking_lat, lng: data.tracking_lng }
      : null
  );
  const [permisoError, setPermisoError] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setPermisoError("Tu navegador no soporta geolocalización.");
      return;
    }

    let cancelled = false;

    function ping() {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setYo({ lat, lng });
          setTracking(true);
          actualizarUbicacionDomiciliario(data.id, lat, lng).then((r) => {
            if (!r.success) console.warn("[tracking]", r.error);
          });
        },
        (err) => {
          if (cancelled) return;
          if (err.code === err.PERMISSION_DENIED) {
            setPermisoError("Necesitamos tu ubicación para que el Cliente sepa dónde vas.");
          } else {
            setPermisoError(`No se pudo obtener ubicación (${err.message}).`);
          }
          setTracking(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }

    ping(); // primero inmediato
    intervalRef.current = setInterval(ping, PING_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [data.id]);

  function handleMarcarEntregado() {
    setConfirmDialog(false);
    startTransition(async () => {
      const result = await marcarEntregadoDomiciliario(data.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Entregado ✓");
      if (intervalRef.current) clearInterval(intervalRef.current);
      // server redirige al revalidatePath, pero forzamos vuelta a lista
      window.location.href = "/domiciliario";
    });
  }

  const markers: MapMarker[] = [];
  if (data.destino_lat != null && data.destino_lng != null) {
    markers.push({
      id: "destino",
      lat: data.destino_lat,
      lng: data.destino_lng,
      label: "Cliente",
      color: "red",
    });
  }
  if (yo) {
    markers.push({ id: "yo", lat: yo.lat, lng: yo.lng, label: "Tú", color: "blue" });
  }

  const mapsLink =
    data.destino_lat != null && data.destino_lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${data.destino_lat},${data.destino_lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.direccion)}`;

  return (
    <>
      {/* Cliente */}
      <div className="rounded-lg border bg-white p-4">
        <p className="text-sm font-semibold">{data.cliente_nombre}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {data.direccion}
          {data.direccion_alias && (
            <span className="ml-1 italic">({data.direccion_alias})</span>
          )}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.cliente_celular && (
            <Button asChild variant="outline" size="sm">
              <a href={`tel:${data.cliente_celular}`}>📞 Llamar Cliente</a>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <a href={mapsLink} target="_blank" rel="noreferrer">
              🧭 Abrir en Maps
            </a>
          </Button>
        </div>
      </div>

      {/* Mapa */}
      {data.destino_lat == null && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          La dirección de este pedido no tiene coordenadas. El mapa muestra solo tu
          ubicación.
        </div>
      )}

      <GoogleMapView markers={markers} height={320} />

      {/* Estado tracking */}
      {permisoError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-900">
          {permisoError} Si rechazaste el permiso, habilítalo desde la configuración
          del navegador.
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          {tracking ? (
            <>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Compartiendo ubicación cada 30s
            </>
          ) : (
            <>
              <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-400" />
              Esperando ubicación...
            </>
          )}
        </div>
      )}

      {/* Acción */}
      <Button
        type="button"
        onClick={() => setConfirmDialog(true)}
        disabled={isPending}
        className="h-14 text-lg"
      >
        Marcar como entregado
      </Button>

      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Entregado al Cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto cierra el pedido. El Cliente lo verá como entregado y desaparece
              de tu lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Aún no</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarcarEntregado}>
              Sí, entregado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
