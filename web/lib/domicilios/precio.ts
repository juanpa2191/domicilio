/**
 * Helpers para precios en pesos colombianos (sin decimales).
 */
export function formatearCOP(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}
