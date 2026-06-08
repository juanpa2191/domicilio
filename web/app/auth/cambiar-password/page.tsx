import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserSurface } from "@/lib/domicilios/auth";
import { CambiarPasswordForm } from "./_components/cambiar-password-form";

const SURFACE_PATHS = {
  admin: "/admin",
  mostrador: "/mostrador",
  cocina: "/cocina",
  domiciliario: "/domiciliario",
  cliente: "/cliente",
} as const;

export default async function CambiarPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Si ya cambió la password, redirigir al surface según rol
  const mustChange = user.user_metadata?.must_change_password === true;
  if (!mustChange) {
    const surface = await getUserSurface(supabase, user.id);
    redirect(SURFACE_PATHS[surface]);
  }

  // Determinar a dónde redirigir tras cambiar la password
  const surface = await getUserSurface(supabase, user.id);
  const redirectTo = SURFACE_PATHS[surface];

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <CambiarPasswordForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
