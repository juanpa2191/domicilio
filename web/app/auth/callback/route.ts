/**
 * OAuth callback handler.
 * Recibe el code de Google (vía Supabase) y lo intercambia por sesión.
 * Después determina el surface destino según el rol del usuario y redirige.
 */
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserSurface, type SurfaceDestino } from "@/lib/domicilios/auth";
import { ensurePerfilCliente } from "@/lib/domicilios/perfil-cliente";
import { NextResponse, type NextRequest } from "next/server";

const SURFACE_PATHS: Record<SurfaceDestino, string> = {
  admin: "/admin",
  mostrador: "/mostrador",
  cocina: "/cocina",
  domiciliario: "/domiciliario",
  cliente: "/cliente",
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const explicitNext = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?error=missing_code`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // Si vino un `next` explícito en el flujo, respetarlo.
  if (explicitNext) {
    return NextResponse.redirect(`${origin}${explicitNext}`);
  }

  // Si no, decidir el surface según rol del usuario.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/auth/error?error=no_user_after_oauth`);
  }

  const surface = await getUserSurface(supabase, user.id);

  // Cliente que entra por primera vez vía Google
  if (surface === "cliente") {
    // 1. Crear perfil si no existe (Story 3.2)
    const nombre =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.email ??
      "Cliente";
    await ensurePerfilCliente(createAdminClient(), user.id, nombre);

    // 2. Forzar aceptación Habeas Data si no la ha dado (Story 1.8)
    const accepted = user.user_metadata?.privacidad_aceptada === true;
    if (!accepted) {
      return NextResponse.redirect(`${origin}/aceptar-privacidad`);
    }
  }

  return NextResponse.redirect(`${origin}${SURFACE_PATHS[surface]}`);
}
