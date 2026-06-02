"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { registrarComprobante } from "../actions";

const MAX_BYTES = 5 * 1024 * 1024;

type FormasPago = {
  nequi: { activo: boolean; celular: string | null };
  bancolombia: { activo: boolean; cuenta: string | null; tipo: string | null };
  daviplata: { activo: boolean; celular: string | null };
};

export function SubirComprobanteForm({
  pedidoId,
  userId,
  comercioNombre,
  formasPago,
  totalCop,
}: {
  pedidoId: string;
  userId: string;
  comercioNombre: string;
  formasPago: FormasPago;
  totalCop: number;
}) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      toast.error("Debe ser JPG, PNG o WEBP");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("Máximo 5 MB");
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    if (!file) {
      toast.error("Selecciona el comprobante primero");
      return;
    }
    setUploading(true);
    try {
      const sb = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${pedidoId}-${Date.now()}.${ext}`;
      const { error: upErr } = await sb.storage
        .from("comprobantes-pago")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      const result = await registrarComprobante(pedidoId, path);
      if (!result.success) throw new Error(result.error);

      toast.success("Comprobante enviado. Esperando confirmación.");
      router.push(`/cliente/pedidos/${pedidoId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error subiendo el comprobante");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <h2 className="text-sm font-semibold">Datos de pago de {comercioNombre}</h2>
          <p className="text-xs text-muted-foreground">
            Transfiere <span className="font-semibold text-foreground">${totalCop.toLocaleString("es-CO")}</span> a
            una de estas cuentas y luego sube el comprobante.
          </p>
          <dl className="grid gap-2 text-sm">
            {formasPago.nequi.activo && formasPago.nequi.celular && (
              <DatoPago label="Nequi" valor={formasPago.nequi.celular} />
            )}
            {formasPago.daviplata.activo && formasPago.daviplata.celular && (
              <DatoPago label="Daviplata" valor={formasPago.daviplata.celular} />
            )}
            {formasPago.bancolombia.activo && formasPago.bancolombia.cuenta && (
              <DatoPago
                label={`Bancolombia (${formasPago.bancolombia.tipo ?? ""})`}
                valor={formasPago.bancolombia.cuenta}
              />
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <p className="text-sm font-semibold">Comprobante</p>
          {previewUrl ? (
            <div className="relative h-48 w-full overflow-hidden rounded-md border">
              <Image src={previewUrl} alt="Comprobante" fill className="object-contain" sizes="100vw" />
            </div>
          ) : null}
          <Button asChild type="button" variant="outline" disabled={uploading}>
            <label className="cursor-pointer">
              {previewUrl ? "Cambiar comprobante" : "Elegir foto del comprobante"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFile}
              />
            </label>
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={!file || uploading}>
        {uploading ? "Subiendo..." : "Enviar comprobante"}
      </Button>
    </div>
  );
}

function DatoPago({ label, valor }: { label: string; valor: string }) {
  function copy() {
    navigator.clipboard.writeText(valor);
    toast.success("Copiado");
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border p-2">
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-mono text-sm">{valor}</dd>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        Copiar
      </Button>
    </div>
  );
}
