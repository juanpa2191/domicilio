"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useCart } from "@/lib/cart/store";
import { formatearCOP } from "@/lib/domicilios/precio";

type Adicion = { id: string; nombre: string; precio_adicional: number };

export function AgregarProductoDialog({
  open,
  onOpenChange,
  comercioId,
  comercioNombre,
  producto,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  comercioId: string;
  comercioNombre: string;
  producto: {
    id: string;
    nombre: string;
    descripcion: string | null;
    precio_cop: number;
    foto_url: string | null;
    adiciones: Adicion[];
  } | null;
}) {
  const addItem = useCart((s) => s.addItem);
  const forceSwitch = useCart((s) => s.forceSwitchComercio);
  const [cantidad, setCantidad] = useState(1);
  const [seleccionadas, setSeleccionadas] = useState<Record<string, boolean>>({});
  const [conflicto, setConflicto] = useState<null | "vaciar_y_agregar">(null);

  if (!producto) return null;

  const adicionesElegidas = producto.adiciones.filter((a) => seleccionadas[a.id]);
  const subtotal =
    (producto.precio_cop + adicionesElegidas.reduce((s, a) => s + a.precio_adicional, 0)) *
    cantidad;

  function reset() {
    setCantidad(1);
    setSeleccionadas({});
  }

  function handleAdd() {
    if (!producto) return;
    const result = addItem(comercioId, comercioNombre, {
      producto_id: producto.id,
      nombre: producto.nombre,
      precio_unitario: producto.precio_cop,
      foto_url: producto.foto_url,
      cantidad,
      adiciones: adicionesElegidas,
      adiciones_disponibles: producto.adiciones,
    });
    if (!result.ok && result.reason === "otro_comercio") {
      setConflicto("vaciar_y_agregar");
      return;
    }
    toast.success(`${producto.nombre} agregado al carrito`);
    reset();
    onOpenChange(false);
  }

  function handleConfirmVaciar() {
    if (!producto) return;
    forceSwitch();
    addItem(comercioId, comercioNombre, {
      producto_id: producto.id,
      nombre: producto.nombre,
      precio_unitario: producto.precio_cop,
      foto_url: producto.foto_url,
      adiciones_disponibles: producto.adiciones,
      cantidad,
      adiciones: adicionesElegidas,
    });
    toast.success(`Carrito reiniciado. ${producto.nombre} agregado.`);
    setConflicto(null);
    reset();
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{producto.nombre}</DialogTitle>
            {producto.descripcion && (
              <DialogDescription>{producto.descripcion}</DialogDescription>
            )}
          </DialogHeader>

          {producto.adiciones.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Adiciones</p>
              {producto.adiciones.map((a) => (
                <label key={a.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Checkbox
                      checked={!!seleccionadas[a.id]}
                      onCheckedChange={(v) =>
                        setSeleccionadas((prev) => ({ ...prev, [a.id]: v === true }))
                      }
                    />
                    {a.nombre}
                  </span>
                  <span className="text-muted-foreground">+{formatearCOP(a.precio_adicional)}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Cantidad</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              >
                −
              </Button>
              <span className="w-8 text-center font-semibold">{cantidad}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCantidad((c) => Math.min(99, c + 1))}
              >
                +
              </Button>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <span className="text-sm">
              <span className="text-muted-foreground">Subtotal: </span>
              <span className="font-semibold">{formatearCOP(subtotal)}</span>
            </span>
            <Button onClick={handleAdd}>Agregar al carrito</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={conflicto !== null} onOpenChange={(v) => !v && setConflicto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Vaciar el carrito anterior?</AlertDialogTitle>
            <AlertDialogDescription>
              Ya tienes productos de otro Comercio en el carrito. Para agregar
              este, debes vaciar el carrito anterior.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmVaciar}>
              Vaciar y agregar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
