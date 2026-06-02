"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  ActualizarComercioSchema,
  type ActualizarComercioInput,
  type Horario,
  DIAS_SEMANA,
  HORARIO_VACIO,
} from "@/lib/domicilios/schemas/comercio";
import { FotoUploader } from "./foto-uploader";
import { actualizarComercio } from "../actions";

export function ConfiguracionForm({
  comercioId,
  initial,
}: {
  comercioId: string;
  initial: ActualizarComercioInput;
}) {
  const form = useForm<ActualizarComercioInput>({
    resolver: zodResolver(ActualizarComercioSchema),
    defaultValues: {
      nombre: initial.nombre,
      direccion: initial.direccion,
      horario: { ...HORARIO_VACIO, ...(initial.horario ?? {}) },
      foto_principal_url: initial.foto_principal_url ?? null,
    },
  });

  async function onSubmit(values: ActualizarComercioInput) {
    const result = await actualizarComercio(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Comercio actualizado");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información básica</CardTitle>
            <CardDescription>Nombre, dirección y foto que verán los clientes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Comercio</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Controller
              control={form.control}
              name="foto_principal_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foto principal</FormLabel>
                  <FotoUploader
                    comercioId={comercioId}
                    initialUrl={field.value ?? null}
                    onChange={(url) => field.onChange(url)}
                  />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horario de atención</CardTitle>
            <CardDescription>
              Fuera del horario, tu Comercio aparecerá cerrado para los clientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {DIAS_SEMANA.map(({ key, label }) => (
                <HorarioDiaRow key={key} dia={key} label={label} form={form} />
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => form.reset()}
            disabled={form.formState.isSubmitting}
          >
            Descartar
          </Button>
        </div>
      </form>
    </Form>
  );
}

function HorarioDiaRow({
  dia,
  label,
  form,
}: {
  dia: keyof Horario;
  label: string;
  form: ReturnType<typeof useForm<ActualizarComercioInput>>;
}) {
  const value = form.watch(`horario.${dia}`);
  const abierto = value !== null;

  function toggle(checked: boolean) {
    if (checked) {
      form.setValue(`horario.${dia}`, { abre: "08:00", cierra: "20:00" }, { shouldDirty: true });
    } else {
      form.setValue(`horario.${dia}`, null, { shouldDirty: true });
    }
  }

  return (
    <li className="grid grid-cols-[140px_80px_1fr] items-center gap-3 sm:grid-cols-[140px_80px_120px_20px_120px_1fr]">
      <span className="text-sm font-medium">{label}</span>
      <label className="flex items-center gap-2 text-xs">
        <Checkbox checked={abierto} onCheckedChange={(v) => toggle(v === true)} />
        {abierto ? "Abierto" : "Cerrado"}
      </label>

      {abierto ? (
        <>
          <Input
            type="time"
            value={value?.abre ?? ""}
            onChange={(e) =>
              form.setValue(
                `horario.${dia}`,
                { abre: e.target.value, cierra: value?.cierra ?? "20:00" },
                { shouldDirty: true, shouldValidate: true }
              )
            }
            className="col-span-1"
          />
          <span className="hidden text-xs text-muted-foreground sm:block">a</span>
          <Input
            type="time"
            value={value?.cierra ?? ""}
            onChange={(e) =>
              form.setValue(
                `horario.${dia}`,
                { abre: value?.abre ?? "08:00", cierra: e.target.value },
                { shouldDirty: true, shouldValidate: true }
              )
            }
            className="col-span-1"
          />
          <span className="col-span-full text-xs text-destructive sm:col-span-1">
            {form.formState.errors.horario?.[dia]?.message}
          </span>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">Sin atención</span>
      )}
    </li>
  );
}
