import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CelularForm } from "./_components/celular-form";

export default async function CelularPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: perfil } = await supabase
    .from("perfiles_cliente")
    .select("celular")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <CelularForm initialCelular={perfil?.celular ?? null} />
      </div>
    </div>
  );
}
