"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { aceptarPrivacidad } from "../actions";

export function AceptarForm() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!accepted) {
      toast.error("Debes marcar la casilla para continuar.");
      return;
    }
    startTransition(async () => {
      const result = await aceptarPrivacidad();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("¡Gracias! Ya puedes usar la app.");
      router.push("/cliente");
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Antes de continuar</CardTitle>
        <CardDescription>
          Para usar Domicilios Norte Aburrá necesitamos tu consentimiento sobre
          el manejo de tus datos personales (Ley 1581 de Colombia).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <p className="text-sm text-muted-foreground">
          Tómate un momento para leer nuestra{" "}
          <Link
            href="/privacidad"
            target="_blank"
            className="text-primary underline-offset-4 hover:underline"
          >
            Política de Privacidad
          </Link>
          . Allí te contamos qué datos recolectamos, para qué los usamos y
          cuáles son tus derechos como titular.
        </p>

        <label className="flex items-start gap-3 text-sm">
          <Checkbox
            checked={accepted}
            onCheckedChange={(v) => setAccepted(v === true)}
            disabled={isPending}
          />
          <span>
            He leído y acepto la{" "}
            <Link
              href="/privacidad"
              target="_blank"
              className="text-primary underline-offset-4 hover:underline"
            >
              Política de Privacidad
            </Link>{" "}
            de Domicilios Norte Aburrá.
          </span>
        </label>

        <Button onClick={handleSubmit} disabled={!accepted || isPending}>
          {isPending ? "Guardando..." : "Aceptar y continuar"}
        </Button>
      </CardContent>
    </Card>
  );
}
