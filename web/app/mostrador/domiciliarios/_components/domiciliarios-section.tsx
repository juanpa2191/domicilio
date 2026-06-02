"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  DomiciliarioSchema,
  type DomiciliarioInput,
} from "@/lib/domicilios/schemas/domiciliario";
import {
  crearDomiciliario,
  toggleDomiciliarioActivo,
  actualizarDomiciliario,
} from "../actions";

type Domiciliario = {
  id: string;
  nombre: string;
  celular: string;
  email: string | null;
  activo: boolean;
};

export function DomiciliariosSection({ initial }: { initial: Domiciliario[] }) {
  const [items, setItems] = useState<Domiciliario[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Domiciliarios
            <span className="ml-2 text-xs text-muted-foreground">({items.length})</span>
          </CardTitle>
          <CardDescription>
            Contactos para coordinar las entregas. Aún no tienen acceso a la app
            (vista propia llega en Fase 2).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin domiciliarios.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((d) => (
                <DomiciliarioRow
                  key={d.id}
                  d={d}
                  editing={editingId === d.id}
                  onStartEdit={() => setEditingId(d.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onUpdated={(updated) => {
                    setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                    setEditingId(null);
                  }}
                  onToggle={(activo) =>
                    setItems((prev) => prev.map((x) => (x.id === d.id ? { ...x, activo } : x)))
                  }
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <NuevoDomiciliarioForm onCreated={(d) => setItems((prev) => [...prev, d])} />
    </div>
  );
}

function NuevoDomiciliarioForm({ onCreated }: { onCreated: (d: Domiciliario) => void }) {
  const form = useForm<DomiciliarioInput>({
    resolver: zodResolver(DomiciliarioSchema),
    defaultValues: { nombre: "", celular: "", email: null },
  });

  async function onSubmit(values: DomiciliarioInput) {
    const result = await crearDomiciliario(values);
    if (!result.success) {
      if (result.field) form.setError(result.field as keyof DomiciliarioInput, { message: result.error });
      else toast.error(result.error);
      return;
    }
    toast.success(`Domiciliario "${values.nombre}" creado`);
    onCreated({
      id: result.data.id,
      nombre: values.nombre,
      celular: values.celular,
      email: values.email ?? null,
      activo: true,
    });
    form.reset({ nombre: "", celular: "", email: null });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agregar Domiciliario</CardTitle>
        <CardDescription>Necesitamos su nombre y celular como mínimo.</CardDescription>
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
                    <Input placeholder="Pedro Ramírez" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="celular"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="3001234567"
                      inputMode="numeric"
                      maxLength={10}
                      {...field}
                    />
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
                  <FormLabel>Email (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="pedro@example.com"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creando..." : "Agregar"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function DomiciliarioRow({
  d,
  editing,
  onStartEdit,
  onCancelEdit,
  onUpdated,
  onToggle,
}: {
  d: Domiciliario;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdated: (d: Domiciliario) => void;
  onToggle: (activo: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<DomiciliarioInput>({
    resolver: zodResolver(DomiciliarioSchema),
    defaultValues: { nombre: d.nombre, celular: d.celular, email: d.email },
  });

  function handleToggle(value: boolean) {
    onToggle(value); // optimistic
    startTransition(async () => {
      const result = await toggleDomiciliarioActivo(d.id, value);
      if (!result.success) {
        onToggle(!value);
        toast.error(result.error);
      }
    });
  }

  async function onSubmit(values: DomiciliarioInput) {
    const result = await actualizarDomiciliario(d.id, values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Domiciliario actualizado");
    onUpdated({ ...d, ...values, email: values.email ?? null });
  }

  if (editing) {
    return (
      <li className="rounded-md border p-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="celular"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl>
                    <Input maxLength={10} inputMode="numeric" {...field} />
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
                  <FormLabel>Email (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                Guardar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onCancelEdit}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-md border p-3 text-sm">
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{d.nombre}</p>
        <p className="text-xs text-muted-foreground">{d.celular}</p>
        {d.email && <p className="text-xs text-muted-foreground">{d.email}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={d.activo} onCheckedChange={handleToggle} disabled={isPending} aria-label="Activo" />
        <Badge variant={d.activo ? "outline" : "secondary"} className="text-xs">
          {d.activo ? "Activo" : "Inactivo"}
        </Badge>
        <Button type="button" variant="ghost" size="sm" onClick={onStartEdit}>
          Editar
        </Button>
      </div>
    </li>
  );
}
