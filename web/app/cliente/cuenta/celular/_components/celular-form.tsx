"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
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
  CelularSchema,
  type CelularInput,
} from "@/lib/domicilios/schemas/perfil-cliente";
import { guardarCelular } from "../actions";

export function CelularForm({ initialCelular }: { initialCelular: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/cliente";

  const form = useForm<CelularInput>({
    resolver: zodResolver(CelularSchema),
    defaultValues: { celular: initialCelular ?? "" },
  });

  async function onSubmit(values: CelularInput) {
    const result = await guardarCelular(values);
    if (!result.success) {
      if (result.field) {
        form.setError(result.field as keyof CelularInput, { message: result.error });
      } else {
        toast.error(result.error);
      }
      return;
    }
    toast.success("Celular guardado");
    router.push(next);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu número de celular</CardTitle>
        <CardDescription>
          Lo necesitamos para que el Comercio te pueda llamar si hay algún
          problema con tu entrega. Solo el Comercio donde pidas lo verá.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="celular"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="3001234567"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>10 dígitos, empezando por 3</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
