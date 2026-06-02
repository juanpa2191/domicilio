"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
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
import { toggleProductoDisponible, eliminarProducto } from "../actions";

export function ProductoRow({
  id,
  nombre,
  descripcion,
  precio_cop,
  foto_url,
  disponible: initialDisponible,
}: {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio_cop: number;
  foto_url: string | null;
  disponible: boolean;
}) {
  const [disponible, setDisponible] = useState(initialDisponible);
  const [isPending, startTransition] = useTransition();

  function handleToggle(value: boolean) {
    setDisponible(value); // optimistic
    startTransition(async () => {
      const result = await toggleProductoDisponible(id, value);
      if (!result.success) {
        setDisponible(!value); // rollback
        toast.error(result.error);
      } else {
        toast.success(value ? "Producto disponible" : "Producto no disponible");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await eliminarProducto(id);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Producto eliminado");
      }
    });
  }

  return (
    <li className="flex items-center gap-4 rounded-md border p-3">
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
        {foto_url ? (
          <Image src={foto_url} alt={nombre} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            sin foto
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{nombre}</p>
        {descripcion && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{descripcion}</p>
        )}
        <p className="mt-1 text-sm font-semibold">
          ${precio_cop.toLocaleString("es-CO")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={disponible}
          onCheckedChange={handleToggle}
          disabled={isPending}
          aria-label="Disponible"
        />
        <Button asChild variant="ghost" size="sm">
          <Link href={`/mostrador/catalogo/productos/${id}`}>Editar</Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isPending}>
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar {nombre}?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Si solo quieres ocultarlo
                temporalmente, usa el toggle de disponible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  );
}
