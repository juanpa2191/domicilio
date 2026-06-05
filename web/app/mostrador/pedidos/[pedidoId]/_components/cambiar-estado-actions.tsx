"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cambiarEstadoPedido, cancelarPedido } from "../actions";
import type { EstadoPedido } from "@/lib/domicilios/estado-pedido";

type Domiciliario = { id: string; nombre: string };

export function CambiarEstadoActions({
  pedidoId,
  estado,
  modalidad,
  domiciliarios,
}: {
  pedidoId: string;
  estado: EstadoPedido;
  modalidad: "domicilio" | "recoger_en_local";
  domiciliarios: Domiciliario[];
}) {
  const [isPending, startTransition] = useTransition();
  const [domiciliarioId, setDomiciliarioId] = useState<string>("");
  const [cancelarOpen, setCancelarOpen] = useState(false);
  const [motivoCancelar, setMotivoCancelar] = useState("");

  function cambiar(nuevoEstado: EstadoPedido, domId?: string) {
    startTransition(async () => {
      const result = await cambiarEstadoPedido(pedidoId, nuevoEstado, domId);
      if (!result.success) toast.error(result.error);
      else toast.success(`Pedido actualizado a "${nuevoEstado.replace("_", " ")}"`);
    });
  }

  function handleCancelar() {
    if (motivoCancelar.trim().length < 3) {
      toast.error("Motivo requerido (min 3 caracteres)");
      return;
    }
    startTransition(async () => {
      const result = await cancelarPedido(pedidoId, motivoCancelar);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Pedido cancelado");
      setCancelarOpen(false);
      setMotivoCancelar("");
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* en_cocina → listo */}
      {estado === "en_cocina" && (
        <>
          <Button onClick={() => cambiar("listo")} disabled={isPending} className="w-full">
            Marcar como listo
          </Button>
          <p className="text-xs text-muted-foreground">
            La Cocina también puede marcarlo desde su vista (Story 5.3).
          </p>
        </>
      )}

      {/* listo → en_domicilio (con domiciliario) o entregado (pickup) */}
      {estado === "listo" && modalidad === "domicilio" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Asignar a Domiciliario</p>
          {domiciliarios.length === 0 ? (
            <p className="rounded-md bg-amber-50 border border-amber-200 p-2 text-xs text-amber-900">
              No tienes Domiciliarios activos. Créalos en{" "}
              <a href="/mostrador/domiciliarios" className="underline">
                Domiciliarios
              </a>{" "}
              para poder despachar.
            </p>
          ) : (
            <>
              <Select value={domiciliarioId} onValueChange={setDomiciliarioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elige uno" />
                </SelectTrigger>
                <SelectContent>
                  {domiciliarios.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => cambiar("en_domicilio", domiciliarioId)}
                disabled={isPending || !domiciliarioId}
                className="w-full"
              >
                Despachar a domicilio
              </Button>
            </>
          )}
        </div>
      )}

      {estado === "listo" && modalidad === "recoger_en_local" && (
        <Button onClick={() => cambiar("entregado")} disabled={isPending} className="w-full">
          Marcar como entregado (Cliente lo recogió)
        </Button>
      )}

      {estado === "listo" && (
        <Button
          type="button"
          variant="outline"
          onClick={() => cambiar("en_cocina")}
          disabled={isPending}
          className="w-full"
        >
          ↩︎ Devolver a cocina (marcado por error)
        </Button>
      )}

      {estado === "en_domicilio" && (
        <Button onClick={() => cambiar("entregado")} disabled={isPending} className="w-full">
          Marcar como entregado
        </Button>
      )}

      {/* Cancelar — disponible en cualquier estado activo */}
      {!["entregado", "cancelado", "pendiente_pago", "validando_pago"].includes(estado) && (
        <>
          <Button
            type="button"
            variant="outline"
            className="mt-2 border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => setCancelarOpen(true)}
            disabled={isPending}
          >
            Cancelar pedido
          </Button>

          <AlertDialog open={cancelarOpen} onOpenChange={setCancelarOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar pedido</AlertDialogTitle>
                <AlertDialogDescription>
                  Cuéntale al Cliente por qué cancelas. Si el Cliente ya pagó,
                  acuérdate de devolverle el dinero por fuera de la app.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                value={motivoCancelar}
                onChange={(e) => setMotivoCancelar(e.target.value)}
                placeholder="Ej: Se nos acabaron los ingredientes"
                maxLength={140}
              />
              <p className="text-right text-xs text-muted-foreground">
                {motivoCancelar.length}/140
              </p>
              <AlertDialogFooter>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelar}
                  disabled={motivoCancelar.trim().length < 3}
                >
                  Cancelar pedido
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
