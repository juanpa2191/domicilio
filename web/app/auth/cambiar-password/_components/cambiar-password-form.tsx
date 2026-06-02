"use client";

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
  CambiarPasswordSchema,
  type CambiarPasswordInput,
} from "@/lib/domicilios/schemas/auth";
import { cambiarPassword } from "../actions";

export function CambiarPasswordForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();

  const form = useForm<CambiarPasswordInput>({
    resolver: zodResolver(CambiarPasswordSchema),
    defaultValues: { nueva_password: "", confirmar_password: "" },
  });

  async function onSubmit(values: CambiarPasswordInput) {
    const result = await cambiarPassword(values);
    if (!result.success) {
      if (result.field) {
        form.setError(result.field as keyof CambiarPasswordInput, {
          message: result.error,
        });
      } else {
        toast.error(result.error);
      }
      return;
    }
    toast.success("Contraseña actualizada");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambia tu contraseña</CardTitle>
        <CardDescription>
          Es la primera vez que entras. Elige una contraseña nueva y guárdala
          en un lugar seguro.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="nueva_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmar_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirma la contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
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
