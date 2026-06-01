/**
 * Función high-level para enviar OTP con failover automático.
 * Story 3.1: implementación completa con LabsMobile primario + Twilio fallback.
 */
import type { SmsResult } from "./index";

export async function sendOTP(celular: string, codigo: string): Promise<SmsResult> {
  // TODO Story 3.1: implementar LabsMobile + Twilio fallback con feature flag USE_TWILIO
  void celular;
  void codigo;
  throw new Error("sendOTP no implementado todavía. Pendiente Story 3.1.");
}
