"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AdicionSeleccionada = {
  id: string;
  nombre: string;
  precio_adicional: number;
};

export type CartItem = {
  // ID local del item dentro del carrito (permite duplicados con distintas adiciones)
  uid: string;
  producto_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  adiciones: AdicionSeleccionada[];
  /** Catálogo de adiciones disponibles para el producto (para editar en el carrito). */
  adiciones_disponibles: AdicionSeleccionada[];
  foto_url: string | null;
};

type CartState = {
  comercio_id: string | null;
  comercio_nombre: string | null;
  items: CartItem[];
  adicion_libre: string;

  addItem: (
    comercio_id: string,
    comercio_nombre: string,
    item: Omit<CartItem, "uid" | "cantidad"> & { cantidad?: number }
  ) => { ok: true } | { ok: false; reason: "otro_comercio" };
  replaceItem: (
    uid: string,
    nuevasAdiciones: AdicionSeleccionada[],
    nuevaCantidad: number
  ) => void;
  removeItem: (uid: string) => void;
  setCantidad: (uid: string, cantidad: number) => void;
  setAdicionLibre: (texto: string) => void;
  clear: () => void;
  forceSwitchComercio: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      comercio_id: null,
      comercio_nombre: null,
      items: [],
      adicion_libre: "",

      addItem: (comercio_id, comercio_nombre, item) => {
        const state = get();
        if (state.comercio_id && state.comercio_id !== comercio_id && state.items.length > 0) {
          return { ok: false, reason: "otro_comercio" };
        }
        const newItem: CartItem = {
          uid: crypto.randomUUID(),
          cantidad: item.cantidad ?? 1,
          ...item,
        };
        set({
          comercio_id,
          comercio_nombre,
          items: [...state.items, newItem],
        });
        return { ok: true };
      },

      replaceItem: (uid, nuevasAdiciones, nuevaCantidad) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.uid === uid
              ? { ...i, adiciones: nuevasAdiciones, cantidad: Math.max(1, nuevaCantidad) }
              : i
          ),
        })),

      removeItem: (uid) =>
        set((state) => {
          const items = state.items.filter((i) => i.uid !== uid);
          return {
            items,
            comercio_id: items.length === 0 ? null : state.comercio_id,
            comercio_nombre: items.length === 0 ? null : state.comercio_nombre,
            adicion_libre: items.length === 0 ? "" : state.adicion_libre,
          };
        }),

      setCantidad: (uid, cantidad) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.uid === uid ? { ...i, cantidad: Math.max(1, cantidad) } : i))
            .filter((i) => i.cantidad > 0),
        })),

      setAdicionLibre: (texto) => set({ adicion_libre: texto.slice(0, 280) }),

      clear: () =>
        set({
          comercio_id: null,
          comercio_nombre: null,
          items: [],
          adicion_libre: "",
        }),

      forceSwitchComercio: () =>
        set({
          comercio_id: null,
          comercio_nombre: null,
          items: [],
          adicion_libre: "",
        }),
    }),
    {
      name: "domicilios-cart",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export function calcularSubtotal(item: CartItem): number {
  const adiciones = item.adiciones.reduce((s, a) => s + a.precio_adicional, 0);
  return (item.precio_unitario + adiciones) * item.cantidad;
}

export function calcularTotal(items: CartItem[]): number {
  return items.reduce((s, i) => s + calcularSubtotal(i), 0);
}
