/**
 * Wrapper de Sentry para captureException con tags consistentes.
 * Regla de architecture.md §Enforcement: errores capturados con tags `{ action, ... }`.
 *
 * Si SENTRY_DSN no está configurado (dev sin Sentry account), hace fallback a console.error.
 */
import * as Sentry from "@sentry/nextjs";

type ErrorTags = {
  action: string;
  [key: string]: string | number | undefined;
};

export function captureException(
  error: unknown,
  options?: { tags?: ErrorTags; extra?: Record<string, unknown> }
) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: options?.tags,
      extra: options?.extra,
    });
  } else {
    console.error("[no-sentry-dsn]", error, options);
  }
}
