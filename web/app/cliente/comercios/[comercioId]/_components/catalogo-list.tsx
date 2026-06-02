"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatearCOP } from "@/lib/domicilios/precio";
import { AgregarProductoDialog } from "./agregar-producto-dialog";

type Adicion = { id: string; nombre: string; precio_adicional: number };
export type ProductoCliente = {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_cop: number;
  foto_url: string | null;
  adiciones: Adicion[];
};

export function CatalogoList({
  comercioId,
  comercioNombre,
  productos,
}: {
  comercioId: string;
  comercioNombre: string;
  productos: ProductoCliente[];
}) {
  const [selected, setSelected] = useState<ProductoCliente | null>(null);

  return (
    <>
      <ul className="flex flex-col gap-3">
        {productos.length === 0 ? (
          <li className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
            Este Comercio aún no tiene productos publicados.
          </li>
        ) : (
          productos.map((p) => (
            <li key={p.id}>
              <Card>
                <CardContent className="flex gap-3 p-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                    {p.foto_url ? (
                      <Image src={p.foto_url} alt={p.nombre} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        sin foto
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{p.nombre}</p>
                    {p.descripcion && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{p.descripcion}</p>
                    )}
                    <p className="mt-1 text-sm font-semibold">{formatearCOP(p.precio_cop)}</p>
                  </div>
                  <div className="flex items-center">
                    <Button size="sm" onClick={() => setSelected(p)}>
                      Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))
        )}
      </ul>

      <AgregarProductoDialog
        open={selected !== null}
        onOpenChange={(v) => !v && setSelected(null)}
        comercioId={comercioId}
        comercioNombre={comercioNombre}
        producto={selected}
      />
    </>
  );
}
