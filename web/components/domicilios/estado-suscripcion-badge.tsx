import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EstadoSuscripcion = "periodo_gratis" | "al_dia" | "pendiente" | "atrasado";

const META: Record<
  EstadoSuscripcion,
  { label: string; className: string }
> = {
  periodo_gratis: {
    label: "Período gratis",
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  },
  al_dia: {
    label: "Al día",
    className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  },
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-100",
  },
  atrasado: {
    label: "Atrasado",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
};

export function EstadoSuscripcionBadge({
  estado,
}: {
  estado: EstadoSuscripcion;
}) {
  const meta = META[estado];
  return (
    <Badge variant="outline" className={cn("font-medium", meta.className)}>
      {meta.label}
    </Badge>
  );
}
