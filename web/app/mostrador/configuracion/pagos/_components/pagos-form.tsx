"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormasPagoSchema,
  type FormasPago,
} from "@/lib/domicilios/schemas/formas-pago";
import { actualizarFormasPago } from "../actions";

export function PagosForm({ initial }: { initial: FormasPago }) {
  const form = useForm<FormasPago>({
    resolver: zodResolver(FormasPagoSchema),
    defaultValues: initial,
  });

  async function onSubmit(values: FormasPago) {
    const result = await actualizarFormasPago(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Formas de pago actualizadas");
  }

  const nequiActivo = form.watch("nequi.activo");
  const bancoActivo = form.watch("bancolombia.activo");
  const daviActivo = form.watch("daviplata.activo");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Nequi */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Nequi</CardTitle>
                <CardDescription>Cliente transfiere a tu Nequi</CardDescription>
              </div>
              <FormField
                control={form.control}
                name="nequi.activo"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </CardHeader>
          {nequiActivo && (
            <CardContent>
              <FormField
                control={form.control}
                name="nequi.celular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular Nequi</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="3001234567"
                        inputMode="numeric"
                        maxLength={10}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          )}
        </Card>

        {/* Bancolombia */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Bancolombia</CardTitle>
                <CardDescription>Transferencia a cuenta Bancolombia</CardDescription>
              </div>
              <FormField
                control={form.control}
                name="bancolombia.activo"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </CardHeader>
          {bancoActivo && (
            <CardContent className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <FormField
                control={form.control}
                name="bancolombia.cuenta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de cuenta</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="12345678901"
                        inputMode="numeric"
                        maxLength={20}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bancolombia.tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      value={field.value ?? undefined}
                      onValueChange={(v) =>
                        field.onChange(v === "ahorros" || v === "corriente" ? v : null)
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Elegir" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ahorros">Ahorros</SelectItem>
                        <SelectItem value="corriente">Corriente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          )}
        </Card>

        {/* Daviplata */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Daviplata</CardTitle>
                <CardDescription>Cliente transfiere a tu Daviplata</CardDescription>
              </div>
              <FormField
                control={form.control}
                name="daviplata.activo"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </CardHeader>
          {daviActivo && (
            <CardContent>
              <FormField
                control={form.control}
                name="daviplata.celular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular Daviplata</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="3001234567"
                        inputMode="numeric"
                        maxLength={10}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          )}
        </Card>

        {/* Efectivo al recibir */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Efectivo al recibir</CardTitle>
                <CardDescription>
                  El domiciliario cobra al entregar el pedido
                </CardDescription>
              </div>
              <FormField
                control={form.control}
                name="efectivo_recibir.activo"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Pago en local */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base">Pago en local</CardTitle>
                <CardDescription>
                  Cliente paga al recoger su pedido en el Comercio
                </CardDescription>
              </div>
              <FormField
                control={form.control}
                name="efectivo_local.activo"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Error global de "mínimo 1 forma" */}
        {form.formState.errors.nequi?.activo?.message && (
          <p className="text-sm text-destructive">
            {form.formState.errors.nequi.activo.message}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar formas de pago"}
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
