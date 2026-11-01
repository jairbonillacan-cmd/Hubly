import { currentAgencyId } from "./live-workspace";
import { mediaRejection, mp4UsesHevc, type MediaRecord } from "./media";

export interface UploadHandle {
  promise: Promise<MediaRecord>;
  cancel: () => void;
}

export async function listMedia(brandId: string): Promise<MediaRecord[]> {
  const agency = currentAgencyId();
  const res = await fetch(`/api/media?brandId=${encodeURIComponent(brandId)}${agency ? `&agencyId=${agency}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar la biblioteca.");
  return ((await res.json()) as { items: MediaRecord[] }).items;
}

export const updateMedia = (id: string, patch: { folder?: string; name?: string }) =>
  fetch(`/api/media/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).then((r) => {
    if (!r.ok) throw new Error("No se pudo actualizar el archivo.");
  });

export const removeMedia = (id: string) =>
  fetch(`/api/media/${id}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error("No se pudo eliminar el archivo.");
  });

/** Avisa si un MP4 usa HEVC; no impide subirlo porque Hubly no lo transcodifica. */
export async function hevcWarning(file: File): Promise<string | null> {
  if (file.type !== "video/mp4" && file.type !== "video/quicktime") return null;
  const head = new Uint8Array(await file.slice(0, 65536).arrayBuffer());
  const tail = new Uint8Array(await file.slice(Math.max(0, file.size - 65536)).arrayBuffer());
  if (!mp4UsesHevc(head) && !mp4UsesHevc(tail)) return null;
  return "Este video usa HEVC: puede no reproducirse en algunos navegadores o redes. Exporta en H.264 si es posible.";
}

/** Sube con XHR porque fetch no informa el progreso de envío. */
export function uploadMedia(
  file: File,
  target: { brandId: string; folder?: string },
  onProgress: (percent: number) => void
): UploadHandle {
  let xhr: XMLHttpRequest | null = null;
  let cancelled = false;
  let recordId: string | null = null;

  const cleanUp = () => {
    // Limpieza de un registro a medias: si falla, el servidor lo purga por antiguo.
    if (recordId) void fetch(`/api/media/${recordId}`, { method: "DELETE" }).catch(() => {});
  };

  const promise = (async () => {
    const rejection = mediaRejection(file.type, file.size);
    if (rejection) throw new Error(rejection);
    const res = await fetch("/api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agencyId: currentAgencyId(),
        brandId: target.brandId,
        folder: target.folder ?? "",
        name: file.name,
        mime: file.type,
        sizeBytes: file.size,
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(res.status === 403 ? "No tienes permiso para subir archivos." : body.error || "No se pudo iniciar la subida.");
    }
    const { record, upload } = (await res.json()) as { record: MediaRecord; upload: { url: string; headers: Record<string, string> } };
    recordId = record.id;
    if (cancelled) {
      cleanUp();
      throw new DOMException("Cancelado", "AbortError");
    }

    await new Promise<void>((resolve, reject) => {
      xhr = new XMLHttpRequest();
      xhr.open("PUT", upload.url);
      xhr.setRequestHeader("Content-Type", file.type);
      for (const [key, value] of Object.entries(upload.headers)) xhr.setRequestHeader(key, value);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
      };
      xhr.onload = () => (xhr!.status < 300 ? resolve() : reject(new Error("El almacenamiento rechazó el archivo.")));
      xhr.onerror = () => reject(new Error("Se perdió la conexión durante la subida."));
      xhr.onabort = () => reject(new DOMException("Cancelado", "AbortError"));
      xhr.send(file);
    });

    const confirm = await fetch(`/api/media/${record.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ready" }),
    });
    if (!confirm.ok) throw new Error("No se pudo confirmar la subida.");
    onProgress(100);
    return { ...record, status: "ready" as const };
  })().catch((error: unknown) => {
    cleanUp();
    throw error;
  });

  return {
    promise,
    cancel: () => {
      cancelled = true;
      xhr?.abort();
    },
  };
}
