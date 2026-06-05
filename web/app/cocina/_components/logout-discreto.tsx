"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Logout detrás de un tap largo (1.5s) en la esquina superior derecha,
// para evitar logouts accidentales con manos ocupadas.
export function LogoutDiscreto() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const router = useRouter();

  function start() {
    timerRef.current = setTimeout(() => setConfirmando(true), 1500);
  }

  function cancel() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  async function doLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <>
      <button
        type="button"
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onContextMenu={(e) => e.preventDefault()}
        className="h-10 w-10 rounded-full text-zinc-700 hover:text-zinc-500"
        aria-label="Mantén presionado para salir"
        title="Mantén presionado para salir"
      >
        ⏻
      </button>

      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90">
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6">
            <p className="mb-4 text-xl text-zinc-100">¿Cerrar sesión de Cocina?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="rounded-md border border-zinc-700 px-6 py-3 text-base text-zinc-300"
              >
                No
              </button>
              <button
                type="button"
                onClick={doLogout}
                className="rounded-md bg-red-600 px-6 py-3 text-base font-semibold text-white"
              >
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
