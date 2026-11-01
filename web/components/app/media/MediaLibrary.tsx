"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, FileText, Folder, FolderPlus, Home, Play, RotateCcw, Search, Trash2, Upload, X } from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { formatBytes, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, mediaFileUrl, type MediaKind, type MediaRecord } from "@/lib/media";
import { hevcWarning, listMedia, removeMedia, updateMedia, uploadMedia, type UploadHandle } from "@/lib/media-client";

interface QueueItem {
  id: string;
  file: File;
  percent: number;
  state: "uploading" | "failed";
  error?: string;
  warning?: string;
  handle?: UploadHandle;
}

interface MediaLibraryProps {
  brandId: string;
  /** Con `onSelectionChange` los archivos se eligen en vez de abrirse. */
  selectable?: boolean;
  accept?: MediaKind[];
  maxSelection?: number;
  onSelectionChange?: (selected: MediaRecord[]) => void;
  onCounts?: (counts: { files: number; folders: number }) => void;
}

const FOLDER_TONES = ["#16324F", "#2A76B0", "#0F766E", "#7C4A1E", "#5B3B8C"];
const toneFor = (name: string) => FOLDER_TONES[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % FOLDER_TONES.length];

export function MediaLibrary({ brandId, selectable = false, accept, maxSelection = 10, onSelectionChange, onCounts }: MediaLibraryProps) {
  const brand = useHublyStore((s) => s.brands.find((b) => b.id === brandId));
  const updateBrand = useHublyStore((s) => s.updateBrand);
  const readOnly = useHublyStore((s) => s.role === "viewer");

  const [items, setItems] = useState<MediaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [folder, setFolder] = useState("");
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [newFolder, setNewFolder] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const fetched = await listMedia(brandId);
      setItems((current) => {
        const fetchedIds = new Set(fetched.map((i) => i.id));
        const localOnly = current.filter((i) => i.brandId === brandId && !fetchedIds.has(i.id));
        return [...localOnly, ...fetched];
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "No se pudo cargar la biblioteca.");
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    // Carga inicial de datos externos al cambiar de marca.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const allowed = useCallback((item: MediaRecord) => !accept || accept.includes(item.kind), [accept]);

  const folders = useMemo(() => {
    const names = new Set([...(brand?.mediaFolders ?? []), ...items.map((i) => i.folder).filter(Boolean)]);
    return [...names].sort((a, b) => a.localeCompare(b, "es"));
  }, [brand?.mediaFolders, items]);

  const searching = query.trim().length > 0;
  const visibleFolders = searching || folder ? [] : folders;
  const visibleFiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => allowed(i) && (q ? i.name.toLowerCase().includes(q) : i.folder === folder));
  }, [allowed, folder, items, query]);
  const fileCount = items.filter(allowed).length;

  useEffect(() => {
    onCounts?.({ files: fileCount, folders: folders.length });
  }, [fileCount, folders.length, onCounts]);

  const toggle = (item: MediaRecord) => {
    const next = selected.includes(item.id)
      ? selected.filter((id) => id !== item.id)
      : selected.length >= maxSelection
        ? selected
        : [...selected, item.id];
    if (next === selected) setNotice(`Puedes elegir hasta ${maxSelection} archivos.`);
    setSelected(next);
    onSelectionChange?.(next.map((id) => items.find((i) => i.id === id)).filter((i): i is MediaRecord => Boolean(i)));
  };

  const startUpload = (file: File, existingId?: string) => {
    const id = existingId ?? `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const handle = uploadMedia(file, { brandId, folder }, (percent) =>
      setQueue((q) => q.map((item) => (item.id === id ? { ...item, percent } : item)))
    );
    setQueue((q) => {
      const entry: QueueItem = { id, file, percent: 0, state: "uploading", handle };
      return existingId ? q.map((item) => (item.id === id ? entry : item)) : [...q, entry];
    });
    void hevcWarning(file).then((warning) => {
      if (warning) setQueue((q) => q.map((item) => (item.id === id ? { ...item, warning } : item)));
    });
    handle.promise
      .then((record) => {
        setQueue((q) => q.filter((item) => item.id !== id));
        setItems((current) => [record, ...current]);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          setQueue((q) => q.filter((item) => item.id !== id));
          return;
        }
        const message = error instanceof Error ? error.message : "No se pudo subir el archivo.";
        setQueue((q) => q.map((item) => (item.id === id ? { ...item, state: "failed", error: message, handle: undefined } : item)));
      });
  };

  const addFiles = (files: FileList | File[]) => {
    if (readOnly) {
      setNotice("Tienes acceso de solo lectura.");
      return;
    }
    Array.from(files).forEach((file) => startUpload(file));
  };

  const createFolder = () => {
    const name = newFolder?.trim();
    setNewFolder(null);
    if (!name || !brand || folders.includes(name)) return;
    updateBrand(brand.id, { mediaFolders: [...(brand.mediaFolders ?? []), name] });
  };

  const moveTo = async (item: MediaRecord, target: string) => {
    setItems((current) => current.map((i) => (i.id === item.id ? { ...i, folder: target } : i)));
    try {
      await updateMedia(item.id, { folder: target });
    } catch (error) {
      setItems((current) => current.map((i) => (i.id === item.id ? item : i)));
      setNotice(error instanceof Error ? error.message : "No se pudo mover el archivo.");
    }
  };

  const remove = async (item: MediaRecord) => {
    if (!window.confirm(`¿Eliminar «${item.name}»? Los posts que lo usan dejarán de mostrarlo.`)) return;
    try {
      await removeMedia(item.id);
      setItems((current) => current.filter((i) => i.id !== item.id));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo eliminar el archivo.");
    }
  };

  const acceptAttr = accept
    ? accept.map((k) => (k === "image" ? "image/*" : k === "video" ? "video/mp4,video/quicktime,video/webm" : k === "pdf" ? "application/pdf" : ".doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv")).join(",")
    : undefined;

  return (
    <div
      className="hubly-media"
      data-dragging={dragging || undefined}
      onDragOver={(e) => {
        if (readOnly) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={acceptAttr}
        data-testid="media-input"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="hubly-media-toolbar">
        <nav className="hubly-media-crumbs" aria-label="Ubicación">
          <button type="button" aria-label="Inicio de la biblioteca" aria-current={!folder ? "page" : undefined} onClick={() => setFolder("")}>
            <Home size={16} />
          </button>
          {folder && (
            <>
              <ChevronRight size={14} aria-hidden />
              <span>{folder}</span>
            </>
          )}
        </nav>
        <label className="hubly-media-search">
          <Search size={15} aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar..." aria-label="Buscar archivos" />
        </label>
        {!readOnly && (
          <div className="hubly-media-actions">
            <button type="button" className="hubly-media-ghost" onClick={() => setNewFolder("")}>
              <FolderPlus size={15} aria-hidden /> Carpeta
            </button>
            <button type="button" className="hubly-media-primary" onClick={() => inputRef.current?.click()}>
              <Upload size={15} aria-hidden /> Subir
            </button>
          </div>
        )}
      </div>

      <div className="hubly-media-body">
        {notice && (
          <p className="hubly-media-notice" role="status">
            {notice}
            <button type="button" aria-label="Cerrar aviso" onClick={() => setNotice(null)}>
              <X size={13} />
            </button>
          </p>
        )}

        {newFolder !== null && (
          <form
            className="hubly-media-newfolder"
            onSubmit={(e) => {
              e.preventDefault();
              createFolder();
            }}
          >
            <input autoFocus value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder="Nombre de la carpeta" aria-label="Nombre de la carpeta" maxLength={120} />
            <button type="submit" className="hubly-media-primary">Crear</button>
            <button type="button" className="hubly-media-ghost" onClick={() => setNewFolder(null)}>Cancelar</button>
          </form>
        )}

        {queue.length > 0 && (
          <ul className="hubly-media-queue" aria-label="Subidas en curso">
            {queue.map((item) => (
              <li key={item.id} data-state={item.state}>
                <div className="hubly-media-queue-row">
                  <strong>{item.file.name}</strong>
                  <span>{item.state === "failed" ? item.error : `${item.percent}% de ${formatBytes(item.file.size)}`}</span>
                  {item.state === "failed" ? (
                    <>
                      <button type="button" onClick={() => startUpload(item.file, item.id)}>
                        <RotateCcw size={13} aria-hidden /> Reintentar
                      </button>
                      <button type="button" aria-label={`Quitar ${item.file.name}`} onClick={() => setQueue((q) => q.filter((i) => i.id !== item.id))}>
                        <X size={13} />
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => item.handle?.cancel()}>Cancelar</button>
                  )}
                </div>
                {item.state === "uploading" && (
                  <div className="hubly-media-bar" role="progressbar" aria-valuenow={item.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Subiendo ${item.file.name}`}>
                    <span style={{ width: `${item.percent}%` }} />
                  </div>
                )}
                {item.warning && <p className="hubly-media-warning">{item.warning}</p>}
              </li>
            ))}
          </ul>
        )}

        {loadError ? (
          <div className="hubly-media-empty">
            <p>{loadError}</p>
            <button type="button" className="hubly-media-ghost" onClick={() => void load()}>Reintentar</button>
          </div>
        ) : loading ? (
          <p className="hubly-media-hint" role="status">Cargando biblioteca…</p>
        ) : (
          <>
            {visibleFolders.length > 0 && (
              <section aria-label="Carpetas">
                <h3 className="hubly-media-heading">Carpetas</h3>
                <div className="hubly-media-folders">
                  {visibleFolders.map((name) => (
                    <button key={name} type="button" className="hubly-media-folder" style={{ background: toneFor(name) }} onClick={() => setFolder(name)}>
                      <Folder size={18} aria-hidden />
                      <strong>{name}</strong>
                      <span>{items.filter((i) => i.folder === name).length} archivos</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {visibleFiles.length > 0 ? (
              <section aria-label="Archivos">
                <h3 className="hubly-media-heading">{searching ? "Resultados" : "Archivos"}</h3>
                <div className="hubly-media-grid">
                  {visibleFiles.map((item) => {
                    const position = selected.indexOf(item.id);
                    const body = (
                      <>
                        <span className="hubly-media-thumb">
                          {item.kind === "image" ? (
                            // Los archivos privados se firman al pedirlos: next/image no puede optimizarlos.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mediaFileUrl(item.id)} alt="" loading="lazy" />
                          ) : item.kind === "video" ? (
                            <>
                              <video src={`${mediaFileUrl(item.id)}#t=0.1`} preload="metadata" muted playsInline />
                              <i aria-hidden><Play size={16} /></i>
                            </>
                          ) : (
                            <FileText size={28} aria-hidden />
                          )}
                          {position >= 0 && <b aria-hidden>{position + 1}</b>}
                        </span>
                        <span className="hubly-media-name">{item.name}</span>
                        <span className="hubly-media-size">{formatBytes(item.sizeBytes)}</span>
                      </>
                    );
                    return (
                      <div key={item.id} className="hubly-media-file" data-selected={position >= 0 || undefined}>
                        {selectable ? (
                          <button type="button" aria-pressed={position >= 0} onClick={() => toggle(item)}>{body}</button>
                        ) : (
                          <a href={mediaFileUrl(item.id)} target="_blank" rel="noreferrer">{body}</a>
                        )}
                        {!selectable && !readOnly && (
                          <div className="hubly-media-file-actions">
                            <select
                              aria-label={`Carpeta de ${item.name}`}
                              value={item.folder}
                              onChange={(e) => void moveTo(item, e.target.value)}
                            >
                              <option value="">Sin carpeta</option>
                              {folders.map((name) => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                            <button type="button" aria-label={`Eliminar ${item.name}`} onClick={() => void remove(item)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : visibleFolders.length === 0 && queue.length === 0 ? (
              <div className="hubly-media-empty">
                <Upload size={22} aria-hidden />
                <p>{searching ? `Sin resultados para «${query.trim()}».` : folder ? "Esta carpeta está vacía." : "Todavía no hay archivos en esta marca."}</p>
                {!searching && !readOnly && (
                  <button type="button" className="hubly-media-primary" onClick={() => inputRef.current?.click()}>Subir archivos</button>
                )}
              </div>
            ) : null}
            <p className="hubly-media-hint">
              {!accept || accept.includes("pdf") || accept.includes("doc")
                ? `Imágenes y documentos hasta ${MAX_IMAGE_BYTES / (1024 * 1024)} MB y videos hasta ${MAX_VIDEO_BYTES / (1024 * 1024)} MB. También puedes arrastrarlos aquí.`
                : `Imágenes hasta ${MAX_IMAGE_BYTES / (1024 * 1024)} MB y videos hasta ${MAX_VIDEO_BYTES / (1024 * 1024)} MB. También puedes arrastrarlos aquí.`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
