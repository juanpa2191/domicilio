import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Dashboard Admin con stats.
 * Usa admin client (service_role) — la auth check se hace en app/admin/layout.tsx.
 */
export default async function AdminHomePage() {
  const admin = createAdminClient();

  const [{ count: comerciosActivos }, { count: comerciosTotal }] = await Promise.all([
    admin
      .from("comercios")
      .select("id", { count: "exact", head: true })
      .eq("activo", true),
    admin.from("comercios").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/admin/comercios/nuevo">+ Nuevo Comercio</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Comercios activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{comerciosActivos ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Comercios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{comerciosTotal ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos (próximamente)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">—</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Disponible en Story 6.4
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Link
          href="/admin/comercios"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Ver todos los Comercios →
        </Link>
      </div>
    </div>
  );
}
