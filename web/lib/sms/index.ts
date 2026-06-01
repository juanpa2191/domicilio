/**
 * Interfaz SmsProvider — abstracción para envío de OTP por SMS.
 * Implementaciones: LabsMobile (primario, Story 3.1), Twilio (fallback, Story 3.1).
 * architecture.md §SMS: LabsMobile preferido por costo en Colombia (~5x más barato que Twilio).
 */

export type SmsResult =
  | { success: true; provider: "labsmobile" | "twilio"; messageId: string }
  | { success: false; error: string; provider: "labsmobile" | "twilio" };

export interface SmsProvider {
  sendOTP(celular: string, codigo: string): Promise<SmsResult>;
}
