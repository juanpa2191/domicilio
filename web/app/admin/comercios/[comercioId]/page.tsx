import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EstadoSuscripcionBadge } from "@/components/domicilios/estado-suscripcion-badge";
import { AccionesComercio } from "./_components/acciones-comercio";
import { metricasPorComercio } from "@/lib/domicilios/admin-metrics";
import { formatearCOP } from "@/lib/domicilios/precio";
import type { Database } from "@/types/supabase";

type EstadoSuscripcion = Database["public"]["Enums"]["estado_suscripcion"];

/**
 * Detalle de un Comercio para admin.
 * Story 1.6 — FR-31.
 */
export default async function ComercioDetallePage({
  params,
}: {
  params: Promise<{ comercioId: string }>;
}) {
  const { comercioId } = await params;
  const admin = createAdminClient();

  const { data: comercio } = await admin
    .from("comercios")
    .select(
      "id, nombre, direccion, activo, fecha_inicio_gratis, fecha_fin_gratis, estado_suscripcion, formas_pago, horario, cerrado_temporalmente, created_at, updated_at"
    )
    .eq("id", comercioId)
    .maybeSingle();

  if (!comercio) {
    notFound();
  }

  const { data: usuarios } = await admin
    .from("usuarios_comercio")
    .select("id, nombre, rol, activo, created_at")
    .eq("comercio_id", comercioId)
    .order("created_at", { ascending: true });

  const metricas = await metricasPorComercio(comercioId);

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/admin/comercios"
          className="text-sm text-muted-foreground hover:text-primary hover:underline"
        >
          ← Volver a Comercios
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{comercio.nombre}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{comercio.direccion}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {comercio.activo ? (
              <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                Activo
              </Badge>
            ) : (
              <Badge variant="secondary">Inactivo</Badge>
            )}
            <EstadoSuscripcionBadge
              estado={comercio.estado_suscripcion as EstadoSuscripcion}
            />
            {comercio.cerrado_temporalmente && (
              <Badge variant="outline" className="bg-amber-50 text-amber-900">
                Cerrado temporalmente
              </Badge>
            )}
          </div>
        </div>

        <AccionesComercio
          comercioId={comercio.id}
          comercioNombre={comercio.nombre}
          activo={comercio.activo}
        />
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pedidos 7d
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metricas.pedidos_7d}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pedidos 30d
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metricas.pedidos_30d}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Cancelados 30d
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                metricas.cancelados_30d > 0 ? "text-red-700" : "text-muted-foreground"
              }`}
            >
              {metricas.cancelados_30d}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Valor 30d
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearCOP(metricas.valor_total_30d)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suscripción</CardTitle>
            <CardDescription>Período gratis y estado de pago</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[140px_1fr] gap-2 text-sm">
              <dt className="text-muted-foreground">Inicio gratis:</dt>
              <dd>{new Date(comercio.fecha_inicio_gratis).toLocaleDateString("es-CO")}</dd>

              <dt className="text-muted-foreground">Fin gratis:</dt>
              <dd>{new Date(comercio.fecha_fin_gratis).toLocaleDateString("es-CO")}</dd>

              <dt className="text-muted-foreground">Estado:</dt>
              <dd>
                <EstadoSuscripcionBadge
                  estado={comercio.estado_suscripcion as EstadoSuscripcion}
                />
              </dd>

              <dt className="text-muted-foreground">Creado:</dt>
              <dd>{new Date(comercio.created_at).toLocaleDateString("es-CO")}</dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Usuarios del Comercio
              <span className="ml-2 text-xs text-muted-foreground">
                ({usuarios?.length ?? 0})
              </span>
            </CardTitle>
            <CardDescription>Mostrador, Cocina y Domiciliarios</CardDescription>
          </CardHeader>
          <CardContent>
            {!usuarios || usuarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin usuarios registrados aún.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {usuarios.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{u.nombre}</p>
                      <p className="text-xs text-muted-foreground capitalize">{u.rol}</p>
                    </div>
                    {u.activo ? (
                      <Badge variant="outline" className="text-xs">
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Inactivo
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
