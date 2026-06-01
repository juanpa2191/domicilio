/**
 * Next.js instrumentation hook — inicializa Sentry server-side y edge runtime.
 * Solo se activa si SENTRY_DSN está configurado en env.
 */
export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.log("[sentry] SENTRY_DSN not set — skipping Sentry init");
    return;
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
