import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function CuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: perfil } = await supabase
    .from("perfiles_cliente")
    .select("nombre, celular")
    .eq("user_id", user.id)
    .maybeSingle();

  async function handleLogout() {
    "use server";
    const sb = await createClient();
    await sb.auth.signOut();
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Mi cuenta</h1>

      <Card>
        <CardContent className="grid grid-cols-[110px_1fr] gap-2 p-4 text-sm">
          <span className="text-muted-foreground">Nombre</span>
          <span>{perfil?.nombre ?? "—"}</span>
          <span className="text-muted-foreground">Email</span>
          <span className="font-mono text-xs">{user.email}</span>
          <span className="text-muted-foreground">Celular</span>
          <span>{perfil?.celular ?? <span className="text-muted-foreground italic">no configurado</span>}</span>
        </CardContent>
      </Card>

      <Button asChild variant="outline">
        <Link href="/cliente/cuenta/celular">
          {perfil?.celular ? "Cambiar celular" : "Agregar celular"}
        </Link>
      </Button>

      <Button asChild variant="outline">
        <Link href="/privacidad">Política de privacidad</Link>
      </Button>

      <form action={handleLogout}>
        <Button type="submit" variant="ghost" className="w-full text-destructive">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
