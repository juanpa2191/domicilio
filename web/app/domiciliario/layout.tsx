import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { LogoutBoton } from "./_components/logout-boton";

export default async function DomiciliarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  if (user.user_metadata?.must_change_password === true) {
    redirect("/auth/cambiar-password");
  }

  const admin = createAdminClient();
  const { data: dom } = await admin
    .from("domiciliarios")
    .select("id, nombre, activo")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!dom || !dom.activo) redirect("/");

  return (
    <div className="flex min-h-svh flex-col bg-zinc-50">
      <header className="border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/domiciliario" className="font-semibold">
            Mis entregas
            <span className="ml-2 text-xs text-muted-foreground">· {dom.nombre}</span>
          </Link>
          <LogoutBoton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-4">{children}</main>
    </div>
  );
}
