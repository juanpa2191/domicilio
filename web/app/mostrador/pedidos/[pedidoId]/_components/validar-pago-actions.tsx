"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  confirmarPago,
  rechazarPago,
  obtenerComprobanteUrl,
} from "../actions";

export function ValidarPagoActions({
  pedidoId,
  formaPago,
}: {
  pedidoId: string;
  formaPago: "transferencia" | "efectivo_recibir" | "efectivo_local";
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [rechazarDialog, setRechazarDialog] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  const [loadingComprobante, setLoadingComprobante] = useState(false);

  async function handleVerComprobante() {
    if (comprobanteUrl) return;
    setLoadingComprobante(true);
    const result = await obtenerComprobanteUrl(pedidoId);
    setLoadingComprobante(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setComprobanteUrl(result.data.url);
  }

  function handleConfirmar() {
    setConfirmDialog(false);
    startTransition(async () => {
      const result = await confirmarPago(pedidoId);
      if (!result.success) toast.error(result.error);
      else toast.success("Pago confirmado — pedido en cocina");
    });
  }

  function handleRechazar() {
    if (motivo.trim().length < 3) {
      toast.error("Motivo requerido (min 3 caracteres)");
      return;
    }
    startTransition(async () => {
      const result = await rechazarPago(pedidoId, motivo);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Pago rechazado — pedido cancelado");
      setRechazarDialog(false);
      setMotivo("");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {formaPago === "transferencia" && (
        <div className="flex flex-col gap-2">
          {comprobanteUrl ? (
            <a href={comprobanteUrl} target="_blank" rel="noreferrer" className="block">
              <div className="relative h-64 w-full overflow-hidden rounded-md border bg-muted">
                <Image
                  src={comprobanteUrl}
                  alt="Comprobante de pago"
                  fill
                  className="object-contain"
                  sizes="100vw"
                  unoptimized
                />
              </div>
              <p className="mt-1 text-center text-xs text-muted-foreground underline">
                Ver en tamaño completo
              </p>
            </a>
          ) : (
            <Button type="button" variant="outline" onClick={handleVerComprobante} disabled={loadingComprobante}>
              {loadingComprobante ? "Cargando..." : "Ver comprobante de pago"}
            </Button>
          )}
        </div>
      )}

      {formaPago !== "transferencia" && (
        <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
          Pago en {formaPago === "efectivo_recibir" ? "efectivo al recibir" : "efectivo al recoger"}.
          No requiere comprobante. Confirma cuando hayas validado el pedido.
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          className="flex-1"
          onClick={() => setConfirmDialog(true)}
          disabled={isPending}
        >
          Confirmar pago
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setRechazarDialog(true)}
          disabled={isPending}
        >
          Rechazar
        </Button>
      </div>

      {/* Confirm Dialog: 1 tap rápido */}
      <AlertDialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar el pago?</AlertDialogTitle>
            <AlertDialogDescription>
              El pedido pasará a estado &quot;En cocina&quot; y aparecerá en la vista de Cocina.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmar}>Sí, confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rechazar Dialog: 2 taps (motivo + enviar) */}
      <AlertDialog open={rechazarDialog} onOpenChange={setRechazarDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar pago</AlertDialogTitle>
            <AlertDialogDescription>
              Cuéntale al Cliente por qué rechazas el pago. Esto cancela el pedido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: El comprobante no es de mi cuenta"
            maxLength={140}
          />
          <p className="text-right text-xs text-muted-foreground">{motivo.length}/140</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRechazar} disabled={motivo.trim().length < 3}>
              Rechazar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
