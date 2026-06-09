// Client helpers para Web Push. Solo se ejecutan en browser.

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<
  | { ok: true; subscription: PushSubscription }
  | { ok: false; error: string }
> {
  if (!isPushSupported())
    return { ok: false, error: "Tu navegador no soporta notificaciones." };

  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapid) return { ok: false, error: "VAPID no configurado." };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Permiso denegado." };
  }

  const reg = await registerServiceWorker();
  if (!reg) return { ok: false, error: "No se pudo registrar el Service Worker." };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid).buffer as ArrayBuffer,
      });
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "No se pudo suscribir.",
      };
    }
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub.toJSON()),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    return { ok: false, error: j.error ?? "Error registrando suscripción." };
  }

  return { ok: true, subscription: sub };
}

export async function unsubscribeFromPush(): Promise<void> {
  const sub = await getCurrentSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  });
  await sub.unsubscribe();
}
