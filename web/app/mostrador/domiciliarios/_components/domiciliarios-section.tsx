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
  NuevoDomiciliarioSchema,
  type DomiciliarioInput,
  type NuevoDomiciliarioInput,
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
            Cada Domiciliario tiene su propio acceso a la app desde{" "}
            <code className="rounded bg-muted px-1 text-xs">/domiciliario</code>.
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
  const form = useForm<NuevoDomiciliarioInput>({
    resolver: zodResolver(NuevoDomiciliarioSchema),
    defaultValues: { nombre: "", celular: "", email: "", password: "" },
  });
  const [credenciales, setCredenciales] = useState<{ email: string; password: string } | null>(null);

  async function onSubmit(values: NuevoDomiciliarioInput) {
    const result = await crearDomiciliario(values);
    if (!result.success) {
      if (result.field)
        form.setError(result.field as keyof NuevoDomiciliarioInput, { message: result.error });
      else toast.error(result.error);
      return;
    }
    toast.success(`Domiciliario "${values.nombre}" creado con acceso a la app`);
    onCreated({
      id: result.data.id,
      nombre: values.nombre,
      celular: values.celular,
      email: values.email,
      activo: true,
    });
    setCredenciales({ email: values.email, password: values.password });
    form.reset({ nombre: "", celular: "", email: "", password: "" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Agregar Domiciliario</CardTitle>
        <CardDescription>
          Crea cuenta de acceso para que pueda ver sus entregas asignadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {credenciales && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
            <p className="font-semibold text-emerald-900">Credenciales temporales:</p>
            <p className="mt-1 font-mono text-xs">Email: {credenciales.email}</p>
            <p className="font-mono text-xs">Password: {credenciales.password}</p>
            <p className="mt-2 text-xs text-emerald-800">
              Comparte estas credenciales con el Domiciliario. Le pediremos cambiar
              el password al primer login.
            </p>
            <button
              type="button"
              onClick={() => setCredenciales(null)}
              className="mt-2 text-xs underline"
            >
              Entendido, cerrar
            </button>
          </div>
        )}

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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="pedro@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password temporal</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Mínimo 6 caracteres" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creando..." : "Crear Domiciliario"}
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
    defaultValues: { nombre: d.nombre, celular: d.celular, email: d.email ?? "" },
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
    onUpdated({ ...d, ...values });
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
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
