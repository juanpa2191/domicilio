import { z } from "zod";

/**
 * Schema para crear un nuevo Comercio + invitar al Mostrador inicial.
 * Story 1.5 — FR-30.
 */
export const CrearComercioSchema = z.object({
  nombre: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede tener más de 100 caracteres")
    .trim(),
  direccion: z
    .string()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(200, "La dirección no puede tener más de 200 caracteres")
    .trim(),
  email_mostrador: z
    .string()
    .email("Email inválido")
    .toLowerCase()
    .trim(),
  nombre_mostrador: z
    .string()
    .min(2, "Nombre del responsable requerido")
    .max(100, "El nombre no puede tener más de 100 caracteres")
    .trim(),
});

export type CrearComercioInput = z.infer<typeof CrearComercioSchema>;

/**
 * Horario semanal del Comercio. Story 2.1 — FR-23.
 * Cada día es `null` (cerrado) o un objeto con apertura y cierre en HH:MM (24h).
 */
const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const HorarioDiaSchema = z.union([
  z.null(),
  z
    .object({
      abre: z.string().regex(HORA_REGEX, "Formato HH:MM"),
      cierra: z.string().regex(HORA_REGEX, "Formato HH:MM"),
    })
    .refine((d) => d.abre < d.cierra, {
      message: "La hora de cierre debe ser mayor a la apertura",
      path: ["cierra"],
    }),
]);

export const HorarioSchema = z.object({
  lunes: HorarioDiaSchema,
  martes: HorarioDiaSchema,
  miercoles: HorarioDiaSchema,
  jueves: HorarioDiaSchema,
  viernes: HorarioDiaSchema,
  sabado: HorarioDiaSchema,
  domingo: HorarioDiaSchema,
});

export type Horario = z.infer<typeof HorarioSchema>;
export type HorarioDia = z.infer<typeof HorarioDiaSchema>;

export const DIAS_SEMANA: { key: keyof Horario; label: string }[] = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

export const HORARIO_VACIO: Horario = {
  lunes: null,
  martes: null,
  miercoles: null,
  jueves: null,
  viernes: null,
  sabado: null,
  domingo: null,
};

/**
 * Schema para actualizar info básica del Comercio. Story 2.1 — FR-23.
 */
export const ActualizarComercioSchema = z.object({
  nombre: z.string().min(2).max(100).trim(),
  direccion: z.string().min(5).max(200).trim(),
  horario: HorarioSchema,
  foto_principal_url: z.string().url().nullable().optional(),
});

export type ActualizarComercioInput = z.infer<typeof ActualizarComercioSchema>;
