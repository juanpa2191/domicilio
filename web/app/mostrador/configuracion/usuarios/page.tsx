import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CrearCocinaForm } from "./_components/crear-cocina-form";

/**
 * Lista de usuarios del Comercio del Mostrador.
 * Usa admin client para listar todos los miembros (la auth check se hace en layout).
 */
export default async function UsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: mostradorRow } = await supabase
    .from("usuarios_comercio")
    .select("comercio_id")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();

  const admin = createAdminClient();
  const usuarios = mostradorRow
    ? (
        await admin
          .from("usuarios_comercio")
          .select("id, nombre, rol, activo, created_at")
          .eq("comercio_id", mostradorRow.comercio_id)
          .order("created_at", { ascending: true })
      ).data
    : [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Usuarios del Comercio</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Gestiona los usuarios Cocina que pueden acceder a su vista de Tiquetes.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Usuarios actuales
              <span className="ml-2 text-xs text-muted-foreground">
                ({usuarios?.length ?? 0})
              </span>
            </CardTitle>
            <CardDescription>Mostrador y Cocina</CardDescription>
          </CardHeader>
          <CardContent>
            {!usuarios || usuarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin usuarios.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {usuarios.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between rounded-md border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{u.nombre}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {u.rol}
                      </p>
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

        <CrearCocinaForm />
      </div>
    </div>
  );
}
