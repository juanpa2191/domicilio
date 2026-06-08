import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserSurface, type SurfaceDestino } from "@/lib/domicilios/auth";

const SURFACE_PATHS: Record<SurfaceDestino, string> = {
  admin: "/admin",
  mostrador: "/mostrador",
  cocina: "/cocina",
  domiciliario: "/domiciliario",
  cliente: "/cliente",
};

/**
 * Home: redirige al surface adecuado según el rol del usuario autenticado.
 * Si no hay sesión, manda al login.
 */
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const surface = await getUserSurface(supabase, user.id);
  redirect(SURFACE_PATHS[surface]);
}
