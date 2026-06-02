"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import {
  ProductoSchema,
  type ProductoInput,
} from "@/lib/domicilios/schemas/producto";
import type { ActionResult } from "@/types/domicilios";
import { revalidatePath } from "next/cache";

/** Obtiene el comercio_id del Mostrador autenticado. Lanza si no es Mostrador. */
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

  if (!row || row.rol !== "mostrador") {
    throw new Error("Solo el Mostrador del Comercio puede gestionar el Catálogo");
  }
  return row.comercio_id;
}

export async function crearProducto(
  input: ProductoInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = ProductoSchema.safeParse(input);
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
    const { data, error } = await admin
      .from("productos")
      .insert({
        comercio_id: comercioId,
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion,
        precio_cop: parsed.data.precio_cop,
        foto_url: parsed.data.foto_url,
        disponible: parsed.data.disponible ?? true,
      })
      .select("id")
      .single();
    if (error) throw error;

    revalidatePath("/mostrador/catalogo");
    return { success: true, data };
  } catch (e) {
    captureException(e, { tags: { action: "crearProducto" } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo crear el producto",
    };
  }
}

export async function actualizarProducto(
  productoId: string,
  input: ProductoInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = ProductoSchema.safeParse(input);
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
      .from("productos")
      .update({
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion,
        precio_cop: parsed.data.precio_cop,
        foto_url: parsed.data.foto_url,
        disponible: parsed.data.disponible ?? true,
      })
      .eq("id", productoId)
      .eq("comercio_id", comercioId); // defensa en profundidad
    if (error) throw error;

    revalidatePath("/mostrador/catalogo");
    revalidatePath(`/mostrador/catalogo/productos/${productoId}`);
    return { success: true, data: { id: productoId } };
  } catch (e) {
    captureException(e, { tags: { action: "actualizarProducto", productoId } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo actualizar el producto",
    };
  }
}

export async function toggleProductoDisponible(
  productoId: string,
  disponible: boolean
): Promise<ActionResult<{ id: string; disponible: boolean }>> {
  try {
    const comercioId = await requireMostradorComercioId();
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("productos")
      .update({ disponible })
      .eq("id", productoId)
      .eq("comercio_id", comercioId)
      .select("id, disponible")
      .single();
    if (error) throw error;

    revalidatePath("/mostrador/catalogo");
    return { success: true, data };
  } catch (e) {
    captureException(e, { tags: { action: "toggleProductoDisponible", productoId } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo cambiar la disponibilidad",
    };
  }
}

export async function eliminarProducto(
  productoId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const comercioId = await requireMostradorComercioId();
    const admin = createAdminClient();
    const { error } = await admin
      .from("productos")
      .delete()
      .eq("id", productoId)
      .eq("comercio_id", comercioId);
    if (error) throw error;

    revalidatePath("/mostrador/catalogo");
    return { success: true, data: { id: productoId } };
  } catch (e) {
    captureException(e, { tags: { action: "eliminarProducto", productoId } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo eliminar el producto",
    };
  }
}
