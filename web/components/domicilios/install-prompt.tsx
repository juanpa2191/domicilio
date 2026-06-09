"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { isIOS, isStandalone } from "@/lib/push/client";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Banner discreto que invita a instalar la PWA.
 * - En Android/Chrome usa el evento beforeinstallprompt.
 * - En iOS muestra instrucciones manuales (Safari no soporta el evento).
 * - Si ya está instalada (standalone) no muestra nada.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosInstructions, setIosInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (localStorage.getItem("install-prompt-dismissed") === "1") {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // En iOS no se dispara el evento — mostramos banner manual
    if (isIOS() && !isStandalone()) {
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show || dismissed) return null;

  async function handleInstall() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setShow(false);
      }
      setDeferred(null);
      return;
    }
    if (isIOS()) setIosInstructions(true);
  }

  function handleDismiss() {
    localStorage.setItem("install-prompt-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
      <div className="flex items-start gap-3">
        <span className="text-2xl">📱</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium">Instala la app</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Acceso rápido desde tu pantalla de inicio + notificaciones.
          </p>
          {iosInstructions && (
            <ol className="mt-2 ml-4 list-decimal space-y-1 text-xs">
              <li>Toca el botón <strong>Compartir</strong> abajo (cuadrado con flecha ↑).</li>
              <li>Toca <strong>&quot;Agregar a inicio&quot;</strong>.</li>
              <li>Toca <strong>&quot;Agregar&quot;</strong> arriba a la derecha.</li>
            </ol>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" onClick={handleInstall}>
          {iosInstructions ? "Entendido" : "Instalar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleDismiss}>
          Ahora no
        </Button>
      </div>
    </div>
  );
}
