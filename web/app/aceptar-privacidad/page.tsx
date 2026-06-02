import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AceptarForm } from "./_components/aceptar-form";

export default async function AceptarPrivacidadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Si ya aceptó, no debería estar aquí
  if (user.user_metadata?.privacidad_aceptada === true) {
    redirect("/cliente");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <AceptarForm />
      </div>
    </div>
  );
}
