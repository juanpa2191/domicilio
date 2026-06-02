"use client";

import { useState, useTransition } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toggleComercioActivo, marcarEstadoSuscripcion } from "../../actions";

type EstadoSuscripcion = "periodo_gratis" | "al_dia" | "pendiente" | "atrasado";

export function AccionesComercio({
  comercioId,
  comercioNombre,
  activo,
}: {
  comercioId: string;
  comercioNombre: string;
  activo: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  function handleToggle(nuevoEstado: boolean) {
    startTransition(async () => {
      const result = await toggleComercioActivo(comercioId, nuevoEstado);
      if (result.success) {
        toast.success(nuevoEstado ? "Comercio reactivado" : "Comercio desactivado");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleMarcarSuscripcion(estado: EstadoSuscripcion) {
    startTransition(async () => {
      const result = await marcarEstadoSuscripcion(comercioId, estado);
      if (result.success) {
        toast.success(`Suscripción marcada como ${estado.replaceAll("_", " ")}`);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={isPending}>
            Marcar suscripción…
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleMarcarSuscripcion("al_dia")}>
            Al día (pago recibido)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMarcarSuscripcion("pendiente")}>
            Pendiente
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMarcarSuscripcion("atrasado")}>
            Atrasado
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMarcarSuscripcion("periodo_gratis")}>
            Período gratis
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {activo ? (
        <AlertDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isPending}>
              Desactivar Comercio
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Desactivar {comercioNombre}?</AlertDialogTitle>
              <AlertDialogDescription>
                Los clientes dejarán de ver este Comercio y no podrán hacer
                pedidos. Los pedidos en curso siguen su flujo normal. Puedes
                reactivarlo cuando quieras.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={isPending}
                onClick={() => {
                  setConfirmDeactivate(false);
                  handleToggle(false);
                }}
              >
                Sí, desactivar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          variant="default"
          disabled={isPending}
          onClick={() => handleToggle(true)}
        >
          Reactivar Comercio
        </Button>
      )}
    </div>
  );
}
