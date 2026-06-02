"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdicionSchema, type AdicionInput } from "@/lib/domicilios/schemas/adicion";
import { crearAdicion, eliminarAdicion } from "../adiciones-actions";

type Adicion = { id: string; nombre: string; precio_adicional: number };

export function AdicionesCard({
  productoId,
  initial,
}: {
  productoId: string;
  initial: Adicion[];
}) {
  const [adiciones, setAdiciones] = useState<Adicion[]>(initial);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AdicionInput>({
    resolver: zodResolver(AdicionSchema),
    defaultValues: { nombre: "", precio_adicional: 0 },
  });

  async function onSubmit(values: AdicionInput) {
    const result = await crearAdicion(productoId, values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setAdiciones((prev) => [...prev, { id: result.data.id, ...values }]);
    form.reset({ nombre: "", precio_adicional: 0 });
    toast.success("Adición agregada");
  }

  function handleDelete(id: string) {
    const prev = adiciones;
    setAdiciones((p) => p.filter((a) => a.id !== id)); // optimistic
    startTransition(async () => {
      const result = await eliminarAdicion(id, productoId);
      if (!result.success) {
        setAdiciones(prev); // rollback
        toast.error(result.error);
      } else {
        toast.success("Adición eliminada");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Adiciones</CardTitle>
        <CardDescription>
          Opciones que el Cliente puede agregar a este producto (ej: &quot;Extra queso +$2.000&quot;).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {adiciones.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay adiciones.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {adiciones.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <span>
                  <span className="font-medium">{a.nombre}</span>
                  <span className="ml-2 text-muted-foreground">
                    +${a.precio_adicional.toLocaleString("es-CO")}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleDelete(a.id)}
                >
                  Eliminar
                </Button>
              </li>
            ))}
          </ul>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-3 sm:grid-cols-[1fr_140px_auto]"
          >
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adición</FormLabel>
                  <FormControl>
                    <Input placeholder="Extra queso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="precio_adicional"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>+ Precio (COP)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={100}
                      value={Number.isFinite(field.value) ? field.value : ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Agregar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
