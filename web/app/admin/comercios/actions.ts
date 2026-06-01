"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import {
  CrearComercioSchema,
  type CrearComercioInput,
} from "@/lib/domicilios/schemas/comercio";
import type { ActionResult } from "@/types/domicilios";
import { revalidatePath } from "next/cache";

type CrearComercioResult = {
  comercio_id: string;
  nombre: string;
  mostrador_email: string;
  temp_password: string;
};

/**
 * Crea un Comercio + invita al Mostrador inicial.
 * Story 1.5 — FR-30.
 *
 * Flujo:
 *  1. Valida input con Zod.
 *  2. Verifica que el caller sea platform_admin (defensa en profundidad sobre RLS).
 *  3. Crea auth.users vía admin client (service_role) con password temporal.
 *  4. Inserta comercios + usuarios_comercio (rol=mostrador).
 *  5. Si algo falla a mitad, rollback manual de lo creado.
 *  6. Retorna el password temporal al admin para que se lo comunique al Mostrador.
 */
export async function crearComercio(
  input: CrearComercioInput
): Promise<ActionResult<CrearComercioResult>> {
  // 1. Validación
  const parsed = CrearComercioSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message ?? "Datos inválidos",
      field: firstIssue?.path[0]?.toString(),
    };
  }
  const data = parsed.data;

  // 2. Auth check (defensa en profundidad)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No autenticado" };
  }
  const { data: adminRow } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminRow) {
    return { success: false, error: "No autorizado" };
  }

  // 3. Crear auth.users con password temporal
  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  let newUserId: string;
  try {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: data.email_mostrador,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: data.nombre_mostrador },
    });
    if (createErr) throw createErr;
    if (!created.user) throw new Error("No se pudo crear el usuario");
    newUserId = created.user.id;
  } catch (e) {
    captureException(e, { tags: { action: "crearComercio.createUser" } });
    return {
      success: false,
      error:
        e instanceof Error
          ? `No se pudo crear el usuario: ${e.message}`
          : "No se pudo crear el usuario",
      field: "email_mostrador",
    };
  }

  // 4. Insertar comercio
  let comercioId: string;
  try {
    const { data: comercio, error: comercioErr } = await admin
      .from("comercios")
      .insert({ nombre: data.nombre, direccion: data.direccion })
      .select("id")
      .single();
    if (comercioErr) throw comercioErr;
    comercioId = comercio.id;
  } catch (e) {
    captureException(e, { tags: { action: "crearComercio.insertComercio" } });
    // Rollback: borrar auth.users que acabamos de crear
    await admin.auth.admin.deleteUser(newUserId).catch(() => null);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error al crear el Comercio",
    };
  }

  // 5. Insertar usuarios_comercio (Mostrador)
  try {
    const { error: ucErr } = await admin.from("usuarios_comercio").insert({
      user_id: newUserId,
      comercio_id: comercioId,
      rol: "mostrador",
      nombre: data.nombre_mostrador,
    });
    if (ucErr) throw ucErr;
  } catch (e) {
    captureException(e, { tags: { action: "crearComercio.insertUsuarioComercio" } });
    // Rollback completo
    await admin.from("comercios").delete().eq("id", comercioId);
    await admin.auth.admin.deleteUser(newUserId).catch(() => null);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Error al vincular el Mostrador",
    };
  }

  // 6. Éxito
  revalidatePath("/admin/comercios");
  return {
    success: true,
    data: {
      comercio_id: comercioId,
      nombre: data.nombre,
      mostrador_email: data.email_mostrador,
      temp_password: tempPassword,
    },
  };
}

function generateTempPassword(): string {
  // 12 caracteres alfanuméricos. Cumple con la política mínima de Supabase Auth.
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, "").slice(0, 12);
}
