"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useCart, calcularTotal } from "@/lib/cart/store";
import { formatearCOP } from "@/lib/domicilios/precio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { crearPedido } from "../actions";

type FormasPagoComercio = {
  nequi: { activo: boolean };
  bancolombia: { activo: boolean };
  daviplata: { activo: boolean };
  efectivo_recibir: { activo: boolean };
  efectivo_local: { activo: boolean };
};

type Modalidad = "domicilio" | "recoger_en_local";
type FormaPago = "transferencia" | "efectivo_recibir" | "efectivo_local";

export function CheckoutForm({
  comercioId,
  formasPago,
  perfilCelular,
}: {
  comercioId: string;
  formasPago: FormasPagoComercio;
  perfilCelular: string | null;
}) {
  const router = useRouter();
  const cart = useCart();
  const total = calcularTotal(cart.items);

  const [modalidad, setModalidad] = useState<Modalidad>("domicilio");
  const [direccion, setDireccion] = useState("");
  const [alias, setAlias] = useState("");
  const [formaPago, setFormaPago] = useState<FormaPago>("transferencia");
  const [isPending, startTransition] = useTransition();

  const aceptaTransferencia =
    formasPago.nequi.activo || formasPago.bancolombia.activo || formasPago.daviplata.activo;
  const aceptaEfectivoRecibir = formasPago.efectivo_recibir.activo;
  const aceptaEfectivoLocal = formasPago.efectivo_local.activo;

  // Opciones de forma de pago según modalidad
  const opciones: { value: FormaPago; label: string; disabled: boolean }[] =
    modalidad === "domicilio"
      ? [
          { value: "transferencia", label: "Pagar por transferencia", disabled: !aceptaTransferencia },
          { value: "efectivo_recibir", label: "Pagar al recibir", disabled: !aceptaEfectivoRecibir },
        ]
      : [
          { value: "transferencia", label: "Pagar por transferencia", disabled: !aceptaTransferencia },
          { value: "efectivo_local", label: "Pagar al recoger", disabled: !aceptaEfectivoLocal },
        ];

  function handleConfirmar() {
    if (!perfilCelular) {
      router.push(`/cliente/cuenta/celular?next=${encodeURIComponent("/cliente/checkout")}`);
      return;
    }
    if (modalidad === "domicilio" && direccion.trim().length < 5) {
      toast.error("Necesitamos una dirección para entregarte.");
      return;
    }

    startTransition(async () => {
      const result = await crearPedido({
        comercio_id: comercioId,
        items: cart.items.map((i) => ({
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          adiciones: i.adiciones,
        })),
        adicion_libre: cart.adicion_libre.trim() || null,
        modalidad,
        forma_pago: formaPago,
        direccion_entrega:
          modalidad === "domicilio"
            ? { alias: alias.trim() || null, direccion: direccion.trim() }
            : null,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      // Limpiar carrito
      cart.clear();

      if (result.data.estado === "pendiente_pago") {
        // Necesita subir comprobante
        router.push(`/cliente/pedidos/${result.data.pedido_id}/subir-comprobante`);
      } else {
        // Efectivo → directo al seguimiento
        router.push(`/cliente/pedidos/${result.data.pedido_id}`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <p className="text-sm font-medium">Modalidad</p>
          <div className="flex flex-col gap-2">
            <ModalidadOption
              value="domicilio"
              label="Entrega a domicilio"
              selected={modalidad === "domicilio"}
              onSelect={() => setModalidad("domicilio")}
            />
            <ModalidadOption
              value="recoger_en_local"
              label="Recoger en local"
              selected={modalidad === "recoger_en_local"}
              onSelect={() => setModalidad("recoger_en_local")}
            />
          </div>
        </CardContent>
      </Card>

      {modalidad === "domicilio" && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <p className="text-sm font-medium">Dirección de entrega</p>
            <Input
              placeholder="Calle 12 #34-56, Barrio Centro"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
            <Input
              placeholder="Alias (opcional: casa, trabajo...)"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <p className="text-sm font-medium">Forma de pago</p>
          <div className="flex flex-col gap-2">
            {opciones.map((op) => (
              <ModalidadOption
                key={op.value}
                value={op.value}
                label={op.label + (op.disabled ? " (no disponible)" : "")}
                selected={formaPago === op.value}
                onSelect={() => !op.disabled && setFormaPago(op.value)}
                disabled={op.disabled}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-16 mt-2 rounded-lg border bg-background p-4 shadow-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total a pagar</span>
          <span className="text-xl font-bold">{formatearCOP(total)}</span>
        </div>
        <Button onClick={handleConfirmar} disabled={isPending} className="w-full">
          {isPending ? "Confirmando..." : "Confirmar pedido"}
        </Button>
      </div>
    </div>
  );
}

function ModalidadOption({
  label,
  selected,
  onSelect,
  disabled,
}: {
  value: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`rounded-md border p-3 text-left text-sm transition-colors ${
        selected ? "border-primary bg-primary/5" : "border-input hover:bg-muted/30"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`inline-block size-4 rounded-full border-2 ${
            selected ? "border-primary bg-primary" : "border-input"
          }`}
        />
        {label}
      </span>
    </button>
  );
}
