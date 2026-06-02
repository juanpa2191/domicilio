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
  CrearUsuarioComercioSchema,
  type CrearUsuarioComercioInput,
} from "@/lib/domicilios/schemas/usuario-comercio";
import { crearUsuarioCocina } from "../actions";

type Summary = { nombre: string; email: string; temp_password: string };

export function CrearCocinaForm() {
  const router = useRouter();
  const [created, setCreated] = useState<Summary | null>(null);

  const form = useForm<CrearUsuarioComercioInput>({
    resolver: zodResolver(CrearUsuarioComercioSchema),
    defaultValues: { nombre: "", email: "", rol: "cocina" },
  });

  async function onSubmit(values: CrearUsuarioComercioInput) {
    const result = await crearUsuarioCocina(values);
    if (!result.success) {
      if (result.field) {
        form.setError(result.field as keyof CrearUsuarioComercioInput, {
          message: result.error,
        });
      } else {
        toast.error(result.error);
      }
      return;
    }
    toast.success(`Usuario Cocina "${result.data.nombre}" creado`);
    setCreated({
      nombre: result.data.nombre,
      email: result.data.email,
      temp_password: result.data.temp_password,
    });
    form.reset();
    router.refresh();
  }

  if (created) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-green-600">✅ Usuario Cocina creado</CardTitle>
          <CardDescription>
            Cópiale al usuario estos datos. La contraseña no se vuelve a mostrar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <dl className="grid grid-cols-[120px_1fr] gap-2 text-sm">
            <dt className="text-muted-foreground">Nombre:</dt>
            <dd className="font-medium">{created.nombre}</dd>
            <dt className="text-muted-foreground">Email:</dt>
            <dd className="font-mono">{created.email}</dd>
            <dt className="text-muted-foreground">Contraseña:</dt>
            <dd>
              <code className="rounded bg-muted px-2 py-1 font-mono text-base">
                {created.temp_password}
              </code>
            </dd>
          </dl>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText(created.temp_password);
                toast.success("Contraseña copiada");
              }}
            >
              Copiar contraseña
            </Button>
            <Button onClick={() => setCreated(null)}>Crear otro</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear usuario Cocina</CardTitle>
        <CardDescription>
          La persona podrá entrar a la app y marcar Tiquetes como listos. La
          contraseña inicial se genera automáticamente y debe cambiarla en su
          primer login.
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
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Lucía Gómez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="lucia@restaurante.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creando..." : "Crear usuario"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
