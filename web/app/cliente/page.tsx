import Link from "next/link";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Lista de Comercios disponibles. Story 3.3 — FR-8.
 * Filtra por activo=true. Si cerrado_temporalmente o fuera de horario, lo muestra deshabilitado.
 */
export default async function ClienteHomePage() {
  const admin = createAdminClient();
  const { data: comercios } = await admin
    .from("comercios")
    .select("id, nombre, direccion, foto_principal_url, activo, cerrado_temporalmente, horario")
    .eq("activo", true)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">Domicilios Norte Aburrá</h1>
      <p className="mt-1 text-sm text-muted-foreground">Elige un Comercio para pedir.</p>

      <ul className="mt-6 flex flex-col gap-3">
        {!comercios || comercios.length === 0 ? (
          <li className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
            Aún no hay Comercios disponibles.
          </li>
        ) : (
          comercios.map((c) => {
            const cerrado = c.cerrado_temporalmente || !estaAbierto(c.horario);
            return (
              <li key={c.id}>
                {cerrado ? (
                  <Card className="opacity-60">
                    <ComercioCardContent comercio={c} cerrado />
                  </Card>
                ) : (
                  <Link href={`/cliente/comercios/${c.id}`}>
                    <Card className="transition-colors hover:bg-muted/30">
                      <ComercioCardContent comercio={c} cerrado={false} />
                    </Card>
                  </Link>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

type ComercioRow = {
  id: string;
  nombre: string;
  direccion: string;
  foto_principal_url: string | null;
  cerrado_temporalmente: boolean;
  horario: unknown;
};

function ComercioCardContent({
  comercio,
  cerrado,
}: {
  comercio: ComercioRow;
  cerrado: boolean;
}) {
  return (
    <CardContent className="flex gap-3 p-3">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
        {comercio.foto_principal_url ? (
          <Image
            src={comercio.foto_principal_url}
            alt={comercio.nombre}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            sin foto
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold">{comercio.nombre}</p>
          {cerrado ? (
            <Badge variant="secondary" className="text-xs">Cerrado</Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-xs">Abierto</Badge>
          )}
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground">{comercio.direccion}</p>
      </div>
    </CardContent>
  );
}

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

function estaAbierto(horario: unknown): boolean {
  if (!horario || typeof horario !== "object") return true; // sin horario configurado → permitimos
  const h = horario as Record<string, { abre: string; cierra: string } | null>;
  const ahora = new Date();
  const diaKey = DIAS[ahora.getDay()];
  const slot = h[diaKey];
  if (!slot) return false;
  const hh = ahora.getHours().toString().padStart(2, "0");
  const mm = ahora.getMinutes().toString().padStart(2, "0");
  const actual = `${hh}:${mm}`;
  return actual >= slot.abre && actual <= slot.cierra;
}
