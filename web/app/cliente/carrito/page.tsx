"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, calcularSubtotal, calcularTotal, type CartItem } from "@/lib/cart/store";
import { formatearCOP } from "@/lib/domicilios/precio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EditarItemDialog } from "./_components/editar-item-dialog";

export default function CarritoPage() {
  const items = useCart((s) => s.items);
  const comercioNombre = useCart((s) => s.comercio_nombre);
  const adicionLibre = useCart((s) => s.adicion_libre);
  const setAdicionLibre = useCart((s) => s.setAdicionLibre);
  const setCantidad = useCart((s) => s.setCantidad);
  const removeItem = useCart((s) => s.removeItem);

  const [editing, setEditing] = useState<CartItem | null>(null);
  const total = calcularTotal(items);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-base font-medium">Tu carrito está vacío</p>
        <p className="text-sm text-muted-foreground">
          Elige un Comercio en la página principal para empezar a pedir.
        </p>
        <Button asChild>
          <Link href="/cliente">Ver Comercios</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Tu carrito</h1>
        {comercioNombre && (
          <p className="text-sm text-muted-foreground">de {comercioNombre}</p>
        )}
      </div>

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.uid}>
            <Card>
              <CardContent className="flex gap-3 p-3">
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                  {item.foto_url ? (
                    <Image src={item.foto_url} alt={item.nombre} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                      sin foto
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.nombre}</p>
                  {item.adiciones.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      + {item.adiciones.map((a) => a.nombre).join(", ")}
                    </p>
                  )}
                  <p className="mt-1 text-sm font-semibold">
                    {formatearCOP(calcularSubtotal(item))}
                  </p>
                  <div className="mt-1 flex gap-3">
                    <button
                      type="button"
                      className="text-xs text-primary underline-offset-2 hover:underline"
                      onClick={() => setEditing(item)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                      onClick={() => removeItem(item.uid)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCantidad(item.uid, item.cantidad - 1)}
                    >
                      −
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold">{item.cantidad}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCantidad(item.uid, item.cantidad + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <div>
        <label htmlFor="adicion-libre" className="text-sm font-medium">
          ¿Algo más? (opcional)
        </label>
        <Textarea
          id="adicion-libre"
          placeholder="Sin cebolla, doble arepa, etc."
          maxLength={280}
          value={adicionLibre}
          onChange={(e) => setAdicionLibre(e.target.value)}
          className="mt-1"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {adicionLibre.length}/280
        </p>
      </div>

      <div className="sticky bottom-16 mt-2 rounded-lg border bg-background p-4 shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold">{formatearCOP(total)}</span>
        </div>
        <Button asChild className="w-full">
          <Link href="/cliente/checkout">Continuar</Link>
        </Button>
      </div>

      <EditarItemDialog
        item={editing}
        open={editing !== null}
        onOpenChange={(v) => !v && setEditing(null)}
      />
    </div>
  );
}
