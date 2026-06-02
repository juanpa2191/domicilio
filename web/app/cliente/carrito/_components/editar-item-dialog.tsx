"use client";

import { useEffect, useState } from "react";
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
import { useCart, calcularSubtotal, type CartItem } from "@/lib/cart/store";
import { formatearCOP } from "@/lib/domicilios/precio";

export function EditarItemDialog({
  item,
  open,
  onOpenChange,
}: {
  item: CartItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const replaceItem = useCart((s) => s.replaceItem);
  const [cantidad, setCantidad] = useState(1);
  const [seleccionadas, setSeleccionadas] = useState<Record<string, boolean>>({});

  // Reset cuando cambia el item
  useEffect(() => {
    if (item) {
      setCantidad(item.cantidad);
      const sel: Record<string, boolean> = {};
      item.adiciones.forEach((a) => {
        sel[a.id] = true;
      });
      setSeleccionadas(sel);
    }
  }, [item]);

  if (!item) return null;

  const disponibles = item.adiciones_disponibles ?? [];
  const adicionesElegidas = disponibles.filter((a) => seleccionadas[a.id]);
  const subtotalPreview = calcularSubtotal({
    ...item,
    adiciones: adicionesElegidas,
    cantidad,
  });

  function handleSave() {
    if (!item) return;
    replaceItem(item.uid, adicionesElegidas, cantidad);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar {item.nombre}</DialogTitle>
          {disponibles.length === 0 && (
            <DialogDescription>
              Este producto no tiene adiciones. Solo puedes cambiar la cantidad.
            </DialogDescription>
          )}
        </DialogHeader>

        {disponibles.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Adiciones</p>
            {disponibles.map((a) => (
              <label
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
              >
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
            <span className="font-semibold">{formatearCOP(subtotalPreview)}</span>
          </span>
          <Button onClick={handleSave}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
