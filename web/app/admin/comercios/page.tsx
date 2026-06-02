import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { EstadoSuscripcionBadge } from "@/components/domicilios/estado-suscripcion-badge";
import type { Database } from "@/types/supabase";

type EstadoSuscripcion = Database["public"]["Enums"]["estado_suscripcion"];

/**
 * Lista de Comercios para admin — Story 1.6 — FR-31.
 * Cada fila es clickable y lleva al detalle.
 */
export default async function ComerciosPage() {
  const admin = createAdminClient();
  const { data: comercios } = await admin
    .from("comercios")
    .select(
      "id, nombre, direccion, activo, fecha_inicio_gratis, fecha_fin_gratis, estado_suscripcion, created_at"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comercios</h1>
        <Button asChild>
          <Link href="/admin/comercios/nuevo">+ Nuevo Comercio</Link>
        </Button>
      </div>

      {!comercios || comercios.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aún no hay Comercios. Crea el primero.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full">
            <thead className="border-b bg-muted/50 text-left text-sm">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Dirección</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Suscripción</th>
                <th className="px-4 py-3 font-medium">Fin período gratis</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {comercios.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/admin/comercios/${c.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {c.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.direccion}</td>
                  <td className="px-4 py-3">
                    {c.activo ? (
                      <span className="text-green-600">Activo</span>
                    ) : (
                      <span className="text-muted-foreground">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoSuscripcionBadge
                      estado={c.estado_suscripcion as EstadoSuscripcion}
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(c.fecha_fin_gratis).toLocaleDateString("es-CO")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/comercios/${c.id}`}
                      className="text-primary hover:underline"
                    >
                      →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
