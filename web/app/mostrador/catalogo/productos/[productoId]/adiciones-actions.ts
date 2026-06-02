"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import { AdicionSchema, type AdicionInput } from "@/lib/domicilios/schemas/adicion";
import type { ActionResult } from "@/types/domicilios";
import { revalidatePath } from "next/cache";

async function requireMostradorComercioId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

async function assertProductoDelComercio(productoId: string, comercioId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("productos")
    .select("id, comercio_id")
    .eq("id", productoId)
    .maybeSingle();
  if (!data || data.comercio_id !== comercioId) throw new Error("Producto no encontrado");
}

export async function crearAdicion(
  productoId: string,
  input: AdicionInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = AdicionSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { success: false, error: first?.message ?? "Datos inválidos", field: first?.path[0]?.toString() };
  }
  try {
    const comercioId = await requireMostradorComercioId();
    await assertProductoDelComercio(productoId, comercioId);
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("adiciones_estructuradas")
      .insert({ producto_id: productoId, nombre: parsed.data.nombre, precio_adicional: parsed.data.precio_adicional })
      .select("id")
      .single();
    if (error) throw error;
    revalidatePath(`/mostrador/catalogo/productos/${productoId}`);
    return { success: true, data };
  } catch (e) {
    captureException(e, { tags: { action: "crearAdicion", productoId } });
    return { success: false, error: e instanceof Error ? e.message : "Error al crear adición" };
  }
}

export async function eliminarAdicion(
  adicionId: string,
  productoId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const comercioId = await requireMostradorComercioId();
    await assertProductoDelComercio(productoId, comercioId);
    const admin = createAdminClient();
    const { error } = await admin.from("adiciones_estructuradas").delete().eq("id", adicionId).eq("producto_id", productoId);
    if (error) throw error;
    revalidatePath(`/mostrador/catalogo/productos/${productoId}`);
    return { success: true, data: { id: adicionId } };
  } catch (e) {
    captureException(e, { tags: { action: "eliminarAdicion", adicionId } });
    return { success: false, error: e instanceof Error ? e.message : "Error al eliminar" };
  }
}
