"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BUCKET = "producto-fotos";
const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export function FotoProductoUploader({
  comercioId,
  initialUrl,
  onChange,
}: {
  comercioId: string;
  initialUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Debe ser JPG, PNG o WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Máximo 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${comercioId}/producto-${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadErr) throw uploadErr;

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUrl(pub.publicUrl);
      onChange(pub.publicUrl);
      toast.success("Foto subida. Recuerda guardar.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleRemove() {
    setUrl(null);
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {url ? (
        <div className="flex items-start gap-4">
          <div className="relative h-32 w-32 overflow-hidden rounded-md border">
            <Image src={url} alt="Foto producto" fill className="object-cover" sizes="128px" />
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild type="button" variant="outline" size="sm" disabled={uploading}>
              <label className="cursor-pointer">
                Cambiar foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={uploading}>
              Quitar foto
            </Button>
          </div>
        </div>
      ) : (
        <Button asChild type="button" variant="outline" disabled={uploading}>
          <label className="cursor-pointer">
            {uploading ? "Subiendo..." : "Subir foto (JPG/PNG, máx 2 MB)"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </Button>
      )}
    </div>
  );
}
