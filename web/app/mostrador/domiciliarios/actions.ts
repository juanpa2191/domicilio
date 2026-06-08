"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import {
  DomiciliarioSchema,
  NuevoDomiciliarioSchema,
  type DomiciliarioInput,
  type NuevoDomiciliarioInput,
} from "@/lib/domicilios/schemas/domiciliario";
import type { ActionResult } from "@/types/domicilios";
import { revalidatePath } from "next/cache";

async function requireMostradorComercioId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");
  const { data: row } = await supabase
    .from("usuarios_comercio")
    .select("comercio_id, rol")
    .eq("user_id", user.id)
    .eq("activo", true)
    .maybeSingle();
  if (!row || row.rol !== "mostrador") throw new Error("Solo el Mostrador");
  return row.comercio_id;
}

export async function crearDomiciliario(
  input: NuevoDomiciliarioInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = NuevoDomiciliarioSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Datos inválidos",
      field: first?.path[0]?.toString(),
    };
  }
  try {
    const comercioId = await requireMostradorComercioId();
    const admin = createAdminClient();

    // 1. Crear cuenta auth
    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        nombre: parsed.data.nombre,
        rol: "domiciliario",
        comercio_id: comercioId,
        must_change_password: true,
      },
    });
    if (authErr || !created.user) {
      return {
        success: false,
        error: authErr?.message ?? "No se pudo crear la cuenta",
        field: "email",
      };
    }
    const userId = created.user.id;

    // 2. Crear domiciliario
    const { data: dom, error: domErr } = await admin
      .from("domiciliarios")
      .insert({
        comercio_id: comercioId,
        nombre: parsed.data.nombre,
        celular: parsed.data.celular,
        email: parsed.data.email,
        user_id: userId,
      })
      .select("id")
      .single();
    if (domErr) {
      // rollback auth
      await admin.auth.admin.deleteUser(userId);
      return { success: false, error: domErr.message };
    }

    // 3. Crear usuarios_comercio (para que herede rol en sistema de roles)
    await admin.from("usuarios_comercio").insert({
      comercio_id: comercioId,
      user_id: userId,
      nombre: parsed.data.nombre,
      rol: "domiciliario",
    });

    revalidatePath("/mostrador/domiciliarios");
    return { success: true, data: { id: dom.id } };
  } catch (e) {
    captureException(e, { tags: { action: "crearDomiciliario" } });
    return { success: false, error: e instanceof Error ? e.message : "Error al crear" };
  }
}

export async function actualizarDomiciliario(
  domiciliarioId: string,
  input: DomiciliarioInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = DomiciliarioSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Datos inválidos",
      field: first?.path[0]?.toString(),
    };
  }
  try {
    const comercioId = await requireMostradorComercioId();
    const admin = createAdminClient();
    const { error } = await admin
      .from("domiciliarios")
      .update({
        nombre: parsed.data.nombre,
        celular: parsed.data.celular,
        email: parsed.data.email,
      })
      .eq("id", domiciliarioId)
      .eq("comercio_id", comercioId);
    if (error) throw error;
    revalidatePath("/mostrador/domiciliarios");
    return { success: true, data: { id: domiciliarioId } };
  } catch (e) {
    captureException(e, { tags: { action: "actualizarDomiciliario", domiciliarioId } });
    return { success: false, error: e instanceof Error ? e.message : "Error al actualizar" };
  }
}

export async function toggleDomiciliarioActivo(
  domiciliarioId: string,
  activo: boolean
): Promise<ActionResult<{ id: string; activo: boolean }>> {
  try {
    const comercioId = await requireMostradorComercioId();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("domiciliarios")
      .update({ activo })
      .eq("id", domiciliarioId)
      .eq("comercio_id", comercioId)
      .select("id, activo")
      .single();
    if (error) throw error;
    revalidatePath("/mostrador/domiciliarios");
    return { success: true, data };
  } catch (e) {
    captureException(e, { tags: { action: "toggleDomiciliarioActivo", domiciliarioId } });
    return { success: false, error: e instanceof Error ? e.message : "Error" };
  }
}
