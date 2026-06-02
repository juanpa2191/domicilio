import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/domicilios/auth";
import { Button } from "@/components/ui/button";

export default async function MostradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Si tiene flag de cambio de password pendiente, redirigir
  if (user.user_metadata?.must_change_password === true) {
    redirect("/auth/cambiar-password");
  }

  const rol = await getUserRole(supabase, user.id);
  if (rol !== "mostrador") {
    redirect("/");
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="container mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/mostrador" className="font-semibold">
            Domicilios Norte Aburrá <span className="text-muted-foreground">· Mostrador</span>
          </Link>
          <nav className="flex gap-2 text-sm">
            <Button asChild variant="ghost" size="sm">
              <Link href="/mostrador">Pedidos</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/mostrador/catalogo">Catálogo</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/mostrador/configuracion/usuarios">Usuarios</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/mostrador/configuracion">Configuración</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
