"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton({
  className,
  label = "Salir",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleClick} className={className}>
      {label}
    </Button>
  );
}
