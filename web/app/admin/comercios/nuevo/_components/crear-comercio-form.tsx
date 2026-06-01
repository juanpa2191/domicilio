"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
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
  CrearComercioSchema,
  type CrearComercioInput,
} from "@/lib/domicilios/schemas/comercio";
import { crearComercio } from "../../actions";

type CreatedSummary = {
  nombre: string;
  mostrador_email: string;
  temp_password: string;
};

export function CrearComercioForm() {
  const router = useRouter();
  const [created, setCreated] = useState<CreatedSummary | null>(null);

  const form = useForm<CrearComercioInput>({
    resolver: zodResolver(CrearComercioSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
      email_mostrador: "",
      nombre_mostrador: "",
    },
  });

  async function onSubmit(values: CrearComercioInput) {
    const result = await crearComercio(values);
    if (!result.success) {
      if (result.field) {
        form.setError(result.field as keyof CrearComercioInput, {
          message: result.error,
        });
      } else {
        toast.error(result.error);
      }
      return;
    }
    toast.success(`Comercio "${result.data.nombre}" creado`);
    setCreated({
      nombre: result.data.nombre,
      mostrador_email: result.data.mostrador_email,
      temp_password: result.data.temp_password,
    });
  }

  if (created) {
    return <SuccessCard summary={created} onClose={() => router.push("/admin/comercios")} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo Comercio</CardTitle>
        <CardDescription>
          Se creará el Comercio + la cuenta del Mostrador inicial con período
          gratis de 60 días. El Mostrador recibirá una contraseña temporal que
          deberás comunicarle.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Comercio</FormLabel>
                  <FormControl>
                    <Input placeholder="Restaurante Don Luis" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Calle 12 #34-56, Barbosa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre_mostrador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Mostrador</FormLabel>
                    <FormControl>
                      <Input placeholder="Don Luis Pérez" {...field} />
                    </FormControl>
                    <FormDescription>Quién administrará el Comercio</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email_mostrador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email del Mostrador</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="don.luis@restaurante.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Usará este email para entrar</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-2 flex gap-2">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creando..." : "Crear Comercio"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/admin/comercios")}
                disabled={form.formState.isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SuccessCard({
  summary,
  onClose,
}: {
  summary: CreatedSummary;
  onClose: () => void;
}) {
  async function copyPassword() {
    await navigator.clipboard.writeText(summary.temp_password);
    toast.success("Contraseña copiada al portapapeles");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-600">✅ Comercio creado</CardTitle>
        <CardDescription>
          Cópiale al Mostrador estos datos. La contraseña no se vuelve a
          mostrar — si la pierdes tienes que generar una nueva manualmente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-[120px_1fr] gap-2 text-sm">
          <dt className="text-muted-foreground">Comercio:</dt>
          <dd className="font-medium">{summary.nombre}</dd>

          <dt className="text-muted-foreground">Email:</dt>
          <dd className="font-mono">{summary.mostrador_email}</dd>

          <dt className="text-muted-foreground">Contraseña:</dt>
          <dd>
            <code className="rounded bg-muted px-2 py-1 font-mono text-base">
              {summary.temp_password}
            </code>
          </dd>
        </dl>

        <div className="flex gap-2">
          <Button onClick={copyPassword} variant="outline">
            Copiar contraseña
          </Button>
          <Button onClick={onClose}>Terminé</Button>
        </div>
      </CardContent>
    </Card>
  );
}
