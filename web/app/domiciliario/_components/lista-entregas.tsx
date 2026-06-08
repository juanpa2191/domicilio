"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatearCOP } from "@/lib/domicilios/precio";

export type Entrega = {
  id: string;
  sequence_number: number;
  total_cop: number;
  cliente_nombre: string;
  cliente_celular: string | null;
  direccion: string;
  direccion_alias: string | null;
  created_at: string;
};

export function ListaEntregas({
  comercioId,
  domiciliarioId,
  initial,
}: {
  comercioId: string;
  domiciliarioId: string;
  initial: Entrega[];
}) {
  const [entregas, setEntregas] = useState<Entrega[]>(initial);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`domiciliario:${domiciliarioId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pedidos",
          filter: `comercio_id=eq.${comercioId}`,
        },
        async (payload) => {
          const nuevo = payload.new as {
            id: string;
            estado: string;
            domiciliario_id: string | null;
          };
          const viejo = payload.old as { estado: string; domiciliario_id: string | null };

          // Entró en_domicilio asignado a mí
          if (
            nuevo.estado === "en_domicilio" &&
            nuevo.domiciliario_id === domiciliarioId &&
            (viejo.estado !== "en_domicilio" || viejo.domiciliario_id !== domiciliarioId)
          ) {
            const fresca = await fetchEntrega(nuevo.id);
            if (fresca) {
              setEntregas((prev) =>
                prev.some((e) => e.id === fresca.id) ? prev : [...prev, fresca]
              );
            }
          }
          // Salió de en_domicilio (entregado/cancelado)
          if (
            viejo.domiciliario_id === domiciliarioId &&
            viejo.estado === "en_domicilio" &&
            nuevo.estado !== "en_domicilio"
          ) {
            setEntregas((prev) => prev.filter((e) => e.id !== nuevo.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [comercioId, domiciliarioId]);

  if (entregas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
        Sin entregas pendientes. Cuando el Mostrador te asigne un pedido aparecerá aquí.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {entregas.map((e) => (
        <li key={e.id}>
          <Link href={`/domiciliario/pedidos/${e.id}`}>
            <Card className="transition-colors hover:bg-muted/30">
              <CardContent className="flex flex-col gap-2 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">#{e.sequence_number}</span>
                  <Badge className="bg-blue-100 text-blue-900 border-blue-200">
                    En camino
                  </Badge>
                </div>
                <div className="text-sm">
                  <p className="font-medium">{e.cliente_nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.direccion}
                    {e.direccion_alias && (
                      <span className="ml-1 italic">({e.direccion_alias})</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t pt-2 text-xs">
                  <span className="text-muted-foreground">
                    {new Date(e.created_at).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="font-semibold">{formatearCOP(e.total_cop)}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function fetchEntrega(pedidoId: string): Promise<Entrega | null> {
  const supabase = createClient();
  const { data: p } = await supabase
    .from("pedidos")
    .select("id, sequence_number, total_cop, cliente_id, direccion_entrega, created_at")
    .eq("id", pedidoId)
    .maybeSingle();
  if (!p) return null;
  const { data: perfil } = await supabase
    .from("perfiles_cliente")
    .select("nombre, celular")
    .eq("user_id", p.cliente_id)
    .maybeSingle();
  const dir = p.direccion_entrega as
    | { direccion: string; alias?: string | null }
    | null;
  return {
    id: p.id,
    sequence_number: p.sequence_number,
    total_cop: p.total_cop,
    cliente_nombre: perfil?.nombre ?? "Cliente",
    cliente_celular: perfil?.celular ?? null,
    direccion: dir?.direccion ?? "Sin dirección",
    direccion_alias: dir?.alias ?? null,
    created_at: p.created_at,
  };
}
