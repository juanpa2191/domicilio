import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "./_components/bottom-nav";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Forzar aceptación de privacidad si es Cliente y no la ha dado
  if (user.user_metadata?.privacidad_aceptada !== true) {
    // Verificar que no sea admin/comercio user — esos no pasan por este flow
    const [{ data: adminRow }, { data: comercioRow }] = await Promise.all([
      supabase.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
      supabase.from("usuarios_comercio").select("user_id").eq("user_id", user.id).eq("activo", true).maybeSingle(),
    ]);
    if (!adminRow && !comercioRow) {
      redirect("/aceptar-privacidad");
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
