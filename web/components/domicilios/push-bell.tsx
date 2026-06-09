"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  isPushSupported,
  isIOS,
  isStandalone,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from "@/lib/push/client";

/**
 * Campanita que pide permiso para recibir push notifications.
 * - Si ya está suscrito: muestra "🔔" y permite desuscribir.
 * - Si no: muestra "🔕" y permite suscribir.
 * - En iOS sin standalone: muestra instrucciones de instalar como PWA primero.
 */
export function PushBell({ className }: { className?: string }) {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) {
      setSubscribed(false);
      return;
    }
    getCurrentSubscription().then((sub) => setSubscribed(!!sub));
  }, []);

  if (!isPushSupported() && !isIOS()) return null;

  async function handleToggle() {
    // iOS requiere PWA instalada (standalone)
    if (isIOS() && !isStandalone()) {
      setIosHelp(true);
      return;
    }
    if (subscribed) {
      await unsubscribeFromPush();
      setSubscribed(false);
      toast.success("Notificaciones desactivadas");
      return;
    }
    const r = await subscribeToPush();
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setSubscribed(true);
    toast.success("¡Listo! Te notificaremos por los cambios.");
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className={className}
        aria-label={subscribed ? "Desactivar notificaciones" : "Activar notificaciones"}
        title={subscribed ? "Notificaciones activas" : "Activar notificaciones"}
      >
        {subscribed ? "🔔" : "🔕"}
      </Button>

      <Dialog open={iosHelp} onOpenChange={setIosHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Instalar app en iOS</DialogTitle>
            <DialogDescription>
              En iPhone/iPad las notificaciones solo funcionan si instalas la app.
              Toma 10 segundos:
            </DialogDescription>
          </DialogHeader>
          <ol className="ml-4 list-decimal space-y-2 text-sm">
            <li>
              Toca el ícono <strong>Compartir</strong> (cuadrado con flecha hacia
              arriba) en la barra inferior de Safari.
            </li>
            <li>
              Desliza y toca <strong>&quot;Agregar a inicio&quot;</strong>.
            </li>
            <li>
              Toca <strong>&quot;Agregar&quot;</strong> arriba a la derecha.
            </li>
            <li>
              Abre la app desde el ícono nuevo en tu pantalla de inicio y vuelve aquí
              para activar las notificaciones.
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
