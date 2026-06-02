"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import {
  CrearUsuarioComercioSchema,
  type CrearUsuarioComercioInput,
} from "@/lib/domicilios/schemas/usuario-comercio";
import type { ActionResult } from "@/types/domicilios";
import { revalidatePath } from "next/cache";

type CrearUsuarioResult = {
  email: string;
  nombre: string;
  rol: "cocina";
  temp_password: string;
};

/**
 * Crea un usuario adicional del Comercio (Cocina en MVP).
 * Story 1.7 — FR-4.
 *
 * Solo Mostrador del Comercio actual puede ejecutarla.
 * Genera contraseña temporal con flag must_change_password=true.
 */
export async function crearUsuarioCocina(
  input: CrearUsuarioComercioInput
): Promise<ActionResult<CrearUsuarioResult>> {
  // 1. Validación
  const parsed = CrearUsuarioComercioSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Datos inválidos",
      field: first?.path[0]?.toString(),
    };
  }
  const data = parsed.data;

  // 2. Auth check: usuario autenticado + rol mostrador
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  // Obtener comercio_id del Mostrador actual
  const { data: mostradorRow } = await supabase
    .from("usuarios_comercio")
    .select("comercio_id, rol")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();

  if (!mostradorRow || mostradorRow.rol !== "mostrador") {
    return { success: false, error: "Solo el Mostrador del Comercio puede crear usuarios" };
  }
  const comercioId = mostradorRow.comercio_id;

  // 3. Crear auth.users con contraseña temporal
  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  let newUserId: string;
  try {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: data.nombre,
        must_change_password: true,
      },
    });
    if (createErr) throw createErr;
    if (!created.user) throw new Error("No se pudo crear el usuario");
    newUserId = created.user.id;
  } catch (e) {
    captureException(e, { tags: { action: "crearUsuarioCocina.createUser" } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo crear el usuario",
      field: "email",
    };
  }

  // 4. Insertar usuarios_comercio
  try {
    const { error: ucErr } = await admin.from("usuarios_comercio").insert({
      user_id: newUserId,
      comercio_id: comercioId,
      rol: data.rol,
      nombre: data.nombre,
    });
    if (ucErr) throw ucErr;
  } catch (e) {
    captureException(e, { tags: { action: "crearUsuarioCocina.insertUC" } });
    await admin.auth.admin.deleteUser(newUserId).catch(() => null);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error al vincular el usuario",
    };
  }

  revalidatePath("/mostrador/configuracion/usuarios");
  return {
    success: true,
    data: {
      email: data.email,
      nombre: data.nombre,
      rol: "cocina",
      temp_password: tempPassword,
    },
  };
}

function generateTempPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "").slice(0, 12);
}
