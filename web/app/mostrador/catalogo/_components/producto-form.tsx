"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import {
  ProductoSchema,
  type ProductoInput,
} from "@/lib/domicilios/schemas/producto";
import { crearProducto, actualizarProducto } from "../actions";
import { FotoProductoUploader } from "./foto-producto-uploader";

type Mode = { kind: "nuevo"; comercioId: string } | { kind: "editar"; productoId: string; comercioId: string };

export function ProductoForm({
  initial,
  mode,
}: {
  initial: ProductoInput;
  mode: Mode;
}) {
  const router = useRouter();

  const form = useForm<ProductoInput>({
    resolver: zodResolver(ProductoSchema),
    defaultValues: {
      ...initial,
      descripcion: initial.descripcion ?? null,
    },
  });

  async function onSubmit(values: ProductoInput) {
    const result =
      mode.kind === "nuevo"
        ? await crearProducto(values)
        : await actualizarProducto(mode.productoId, values);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(mode.kind === "nuevo" ? "Producto creado" : "Producto actualizado");
    router.push("/mostrador/catalogo");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información</CardTitle>
            <CardDescription>Datos visibles para el Cliente al pedir</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Almuerzo del día" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="precio_cop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio (COP)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      placeholder="15000"
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

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      maxLength={200}
                      placeholder="Sopa + plato + jugo natural"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="foto_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto (opcional)</FormLabel>
                  <FotoProductoUploader
                    comercioId={mode.comercioId}
                    initialUrl={field.value ?? null}
                    onChange={(url) => field.onChange(url)}
                  />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="disponible"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-4 rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">Disponible hoy</p>
                      <p className="text-xs text-muted-foreground">
                        Si lo apagas, el Cliente no verá este producto.
                      </p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Guardando..."
              : mode.kind === "nuevo"
                ? "Crear producto"
                : "Guardar cambios"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/mostrador/catalogo")}
            disabled={form.formState.isSubmitting}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
