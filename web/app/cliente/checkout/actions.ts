"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { captureException } from "@/lib/sentry";
import {
  CrearPedidoSchema,
  type CrearPedidoInput,
} from "@/lib/domicilios/schemas/pedido";
import type { ActionResult } from "@/types/domicilios";
import { revalidatePath } from "next/cache";

/**
 * Crea un Pedido + sus items_pedido.
 * Story 3.7 — FR-12.
 *
 * - Calcula precios desde el snapshot de la DB (no confiamos en el cliente).
 * - Bloquea si el Cliente no tiene celular en perfiles_cliente (FR-1 revisada).
 * - Pedido entra en `pendiente_pago` (transferencia) o `validando_pago` (efectivo).
 */
type CrearPedidoResult = {
  pedido_id: string;
  estado: "pendiente_pago" | "validando_pago";
  total_cop: number;
};

export async function crearPedido(
  input: CrearPedidoInput
): Promise<ActionResult<CrearPedidoResult>> {
  const parsed = CrearPedidoSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      success: false,
      error: first?.message ?? "Datos inválidos",
      field: first?.path.join(".") || undefined,
    };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  // Bloquear si no tiene celular en perfil
  const { data: perfil } = await supabase
    .from("perfiles_cliente")
    .select("celular")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!perfil?.celular) {
    return { success: false, error: "Necesitamos tu celular antes de pedir.", field: "celular" };
  }

  const admin = createAdminClient();

  // Límite 3 pedidos activos simultáneos (Story 6.3)
  const { count: activosCount } = await admin
    .from("pedidos")
    .select("id", { count: "exact", head: true })
    .eq("cliente_id", user.id)
    .in("estado", [
      "pendiente_pago",
      "validando_pago",
      "en_cocina",
      "listo",
      "en_domicilio",
    ]);
  if ((activosCount ?? 0) >= 3) {
    return {
      success: false,
      error:
        "Ya tienes 3 pedidos activos. Espera a que se completen o cancelen para hacer uno nuevo.",
    };
  }

  // Validar Comercio activo y abierto
  const { data: comercio } = await admin
    .from("comercios")
    .select("id, activo, cerrado_temporalmente")
    .eq("id", data.comercio_id)
    .maybeSingle();
  if (!comercio || !comercio.activo || comercio.cerrado_temporalmente) {
    return { success: false, error: "Este Comercio no está recibiendo pedidos ahora mismo." };
  }

  // Obtener productos del DB para validar precios y disponibilidad
  const productoIds = data.items.map((i) => i.producto_id);
  const { data: productos } = await admin
    .from("productos")
    .select("id, nombre, precio_cop, disponible, comercio_id")
    .in("id", productoIds);
  if (!productos || productos.length !== productoIds.length) {
    return { success: false, error: "Algún producto ya no existe." };
  }

  for (const p of productos) {
    if (!p.disponible) return { success: false, error: `"${p.nombre}" no está disponible.` };
    if (p.comercio_id !== data.comercio_id) {
      return { success: false, error: "Mezcla de productos de distintos Comercios no permitida." };
    }
  }

  // Calcular totales del lado server
  type ItemDB = {
    producto_id: string;
    nombre_snapshot: string;
    cantidad: number;
    precio_unitario_cop: number;
    adiciones_seleccionadas: { id: string; nombre: string; precio_adicional: number }[];
    subtotal_cop: number;
  };

  const itemsDB: ItemDB[] = [];
  for (const item of data.items) {
    const p = productos.find((x) => x.id === item.producto_id);
    if (!p) continue;
    const adiSum = item.adiciones.reduce((s, a) => s + a.precio_adicional, 0);
    const subtotal = (p.precio_cop + adiSum) * item.cantidad;
    itemsDB.push({
      producto_id: p.id,
      nombre_snapshot: p.nombre,
      cantidad: item.cantidad,
      precio_unitario_cop: p.precio_cop,
      adiciones_seleccionadas: item.adiciones,
      subtotal_cop: subtotal,
    });
  }

  const total = itemsDB.reduce((s, i) => s + i.subtotal_cop, 0);

  // Estado inicial según forma de pago
  const estado_inicial: "pendiente_pago" | "validando_pago" =
    data.forma_pago === "transferencia" ? "pendiente_pago" : "validando_pago";

  try {
    // Insertar Pedido
    const { data: pedidoNuevo, error: pedidoErr } = await admin
      .from("pedidos")
      .insert({
        cliente_id: user.id,
        comercio_id: data.comercio_id,
        modalidad: data.modalidad,
        forma_pago: data.forma_pago,
        estado: estado_inicial,
        adicion_libre: data.adicion_libre?.trim() || null,
        direccion_entrega: data.direccion_entrega ?? null,
        total_cop: total,
      })
      .select("id")
      .single();
    if (pedidoErr) throw pedidoErr;

    // Insertar items
    const { error: itemsErr } = await admin
      .from("items_pedido")
      .insert(
        itemsDB.map((i) => ({
          pedido_id: pedidoNuevo.id,
          ...i,
        }))
      );
    if (itemsErr) {
      // Rollback manual
      await admin.from("pedidos").delete().eq("id", pedidoNuevo.id);
      throw itemsErr;
    }

    revalidatePath("/cliente/mis-pedidos");
    revalidatePath("/mostrador");
    return {
      success: true,
      data: { pedido_id: pedidoNuevo.id, estado: estado_inicial, total_cop: total },
    };
  } catch (e) {
    captureException(e, { tags: { action: "crearPedido" } });
    return {
      success: false,
      error: e instanceof Error ? e.message : "No se pudo crear el pedido",
    };
  }
}
