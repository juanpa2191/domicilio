import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/domicilios/auth";
import { LogoutDiscreto } from "./_components/logout-discreto";
import { PushBell } from "@/components/domicilios/push-bell";

export default async function CocinaLayout({
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

  const rol = await getUserRole(supabase, user.id);
  if (rol !== "cocina") {
    redirect("/");
  }

  return (
    <div className="flex min-h-svh flex-col bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Cocina</h1>
          <div className="flex items-center gap-1">
            <PushBell className="text-zinc-300" />
            <LogoutDiscreto />
          </div>
        </div>
      </header>
      <main className="flex-1 px-6 py-4">{children}</main>
    </div>
  );
}
