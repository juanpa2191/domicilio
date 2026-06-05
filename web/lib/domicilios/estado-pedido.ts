export type EstadoPedido =
  | "pendiente_pago"
  | "validando_pago"
  | "en_cocina"
  | "listo"
  | "en_domicilio"
  | "entregado"
  | "cancelado";

export const ESTADO_META: Record<
  EstadoPedido,
  { label: string; className: string }
> = {
  pendiente_pago: {
    label: "Pendiente de pago",
    className: "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100",
  },
  validando_pago: {
    label: "Validando pago",
    className: "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100",
  },
  en_cocina: {
    label: "En cocina",
    className: "bg-orange-100 text-orange-900 border-orange-200 hover:bg-orange-100",
  },
  listo: {
    label: "Listo",
    className: "bg-emerald-100 text-emerald-900 border-emerald-200 hover:bg-emerald-100",
  },
  en_domicilio: {
    label: "En camino",
    className: "bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-100",
  },
  entregado: {
    label: "Entregado",
    className: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-red-100 text-red-900 border-red-200 hover:bg-red-100",
  },
};

export function tiempoTranscurrido(createdAt: string): string {
  const diff = Date.now() - new Date(createdAt).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const remMin = min % 60;
  return remMin === 0 ? `${h}h` : `${h}h ${remMin}min`;
}
