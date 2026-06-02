"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { setCerradoTemporalmente } from "../actions";

export function CerradoTemporalCard({ initial }: { initial: boolean }) {
  const [cerrado, setCerrado] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function handleToggle(value: boolean) {
    setCerrado(value); // optimistic
    startTransition(async () => {
      const result = await setCerradoTemporalmente(value);
      if (!result.success) {
        setCerrado(!value);
        toast.error(result.error);
      } else {
        toast.success(value ? "Comercio cerrado temporalmente" : "Comercio abierto");
      }
    });
  }

  return (
    <Card
      className={cerrado ? "border-amber-300 bg-amber-50" : ""}
    >
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div>
          <p className="text-sm font-semibold">
            {cerrado ? "Comercio CERRADO temporalmente" : "Comercio ABIERTO"}
          </p>
          <p className="text-xs text-muted-foreground">
            {cerrado
              ? "Los clientes no pueden hacer nuevos pedidos. Los pedidos en curso siguen su flujo."
              : "Recibiendo pedidos normalmente. Apaga este toggle para pausar."}
          </p>
        </div>
        <Switch checked={cerrado} onCheckedChange={handleToggle} disabled={isPending} />
      </CardContent>
    </Card>
  );
}
