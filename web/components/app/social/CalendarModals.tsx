"use client";

import { useMemo, useRef, useState } from "react";
import { HublyCloseIcon as X } from "@/components/app/icons/DuotoneIcons";
import { STATUS_META } from "./status-meta";
import { useHublyStore } from "@/lib/store";
import { useLayer } from "@/lib/use-layer";
import { inPeriod, periodLabel } from "@/lib/calendar-views";
import { guessMapping, IMPORT_FIELDS, parseDelimited, reviewRows, type ColumnMapping, type ImportFieldId } from "@/lib/post-import";
import type { BrandWorkspace, SocialPost } from "@/lib/types";
import { postStatusLabel } from "@/lib/labels";
import { FeedSimulator } from "./FeedSimulator";

function ModalShell({ title, subtitle, onClose, children, footer, wide }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  useLayer(true, onClose);
  return (
    <div className="hubly-picker-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hubly-picker hubly-social-modal" data-wide={wide || undefined} role="dialog" aria-modal="true" aria-label={title}>
        <header className="hubly-picker-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" aria-label="Cerrar" autoFocus onClick={onClose}><X size={18} /></button>
        </header>
        <div className="hubly-social-modal-body">{children}</div>
        {footer && <footer className="hubly-picker-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function FeedModal({ posts, onClose }: { posts: SocialPost[]; onClose: () => void }) {
  const dated = posts.filter((p) => p.scheduledDate);
  const missing = posts.length - dated.length;
  return (
    <ModalShell
      title="Ver feed"
      subtitle="Una simulación del perfil: no publica nada."
      onClose={onClose}
      footer={<span>{dated.length} post{dated.length === 1 ? "" : "s"} con fecha{missing > 0 ? ` · ${missing} fuera del feed por no tener fecha` : ""}</span>}
    >
      <FeedSimulator posts={dated} />
    </ModalShell>
  );
}

export function CreateGridModal({ brand, anchor, posts, onCopyLink, onClose }: { brand: BrandWorkspace; anchor: string; posts: SocialPost[]; onCopyLink: () => void; onClose: () => void }) {
  const updatePostStatus = useHublyStore((s) => s.updatePostStatus);
  const authorName = useHublyStore((s) => s.profile?.name) || "Equipo";
  const readOnly = useHublyStore((s) => s.role === "viewer");
  const [copied, setCopied] = useState(false);
  const monthPosts = useMemo(
    () => posts.filter((p) => inPeriod(p.scheduledDate, anchor, "mes")).sort((a, b) => `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`)),
    [anchor, posts]
  );
  const drafts = monthPosts.filter((p) => p.status === "draft");
  const visible = monthPosts.filter((p) => p.status !== "draft");
  return (
    <ModalShell
      title={`Parrilla de ${periodLabel(anchor, "mes")}`}
      subtitle={`${brand.name}: lo que verá tu cliente en su enlace de revisión.`}
      onClose={onClose}
      wide
      footer={
        <>
          <span>{visible.length} visibles para el cliente{drafts.length ? ` · ${drafts.length} borradores ocultos` : ""}</span>
          {!readOnly && drafts.length > 0 && (
            <button type="button" className="hubly-media-ghost" onClick={() => drafts.forEach((p) => updatePostStatus(p.id, "pending", undefined, authorName, "agency"))}>
              Enviar {drafts.length} borrador{drafts.length === 1 ? "" : "es"} a revisión
            </button>
          )}
          <button
            type="button"
            className="hubly-media-primary"
            disabled={visible.length === 0}
            onClick={() => {
              onCopyLink();
              setCopied(true);
            }}
          >
            {copied ? "Enlace copiado" : "Copiar enlace para el cliente"}
          </button>
        </>
      }
    >
      {monthPosts.length === 0 ? (
        <p className="hubly-media-hint">Este mes no tiene posts con fecha. Agrega o trae posts para armar la parrilla.</p>
      ) : (
        <table className="hubly-social-table">
          <thead>
            <tr><th>Fecha</th><th>Post</th><th>Redes</th><th>Formato</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {monthPosts.map((p) => (
              <tr key={p.id} data-muted={p.status === "draft" || undefined}>
                <td>{p.scheduledDate}{p.scheduledTime ? ` ${p.scheduledTime}` : ""}</td>
                <td><strong>{p.title}</strong><small style={{ display: "block", color: "var(--ui-text-3)" }}>{p.caption.slice(0, 90)}</small></td>
                <td>{p.networks.join(", ")}</td>
                <td>{p.format}</td>
                <td>{p.status === "draft" ? "Borrador (oculto)" : postStatusLabel(p.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModalShell>
  );
}

type Step = "origen" | "mapeo" | "revision" | "listo";

export function ImportMonthModal({ brand, posts, onClose }: { brand: BrandWorkspace; posts: SocialPost[]; onClose: () => void }) {
  const savePost = useHublyStore((s) => s.savePost);
  const profileName = useHublyStore((s) => s.profile?.name) || "";
  const [step, setStep] = useState<Step>("origen");
  const [pasted, setPasted] = useState("");
  const [table, setTable] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const headers = table[0] ?? [];
  const review = useMemo(
    () => (step === "revision" ? reviewRows(table.slice(1), mapping, posts.filter((p) => p.brandId === brand.id), brand.connectedNetworks ?? []) : []),
    [brand.connectedNetworks, brand.id, mapping, posts, step, table]
  );
  const valid = review.filter((r) => r.errors.length === 0 && (!skipDuplicates || !r.duplicate));

  const loadTable = (rows: string[][]) => {
    if (rows.length < 2) {
      setError("No encontramos filas: la primera debe tener los títulos de las columnas y la segunda en adelante, los posts.");
      return;
    }
    setError(null);
    setTable(rows);
    setMapping(guessMapping(rows[0]));
    setStep("mapeo");
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (/\.xlsx$/i.test(file.name)) {
        const { default: readXlsx } = await import("read-excel-file/browser");
        const result = await readXlsx(file);
        const sheet = (Array.isArray(result[0]) ? result : (result[0] as unknown as { data: unknown[][] }).data) as unknown[][];
        loadTable(
          sheet.map((row) =>
            row.map((cell) => (cell instanceof Date ? cell.toISOString().slice(0, 10) : cell === null || cell === undefined ? "" : String(cell)).trim())
          ).filter((row) => row.some(Boolean))
        );
      } else if (/\.(csv|tsv|txt)$/i.test(file.name)) {
        loadTable(parseDelimited(await file.text()));
      } else {
        setError("Ese formato no se admite. Desde Notion, Asana o Google Sheets exporta a CSV o XLSX.");
      }
    } catch {
      setError("No pudimos leer ese archivo. Revisa que sea un CSV o XLSX válido.");
    }
  };

  const confirm = () => {
    valid.forEach((row) =>
      savePost({
        brandId: brand.id,
        title: row.title,
        caption: row.caption,
        network: row.networks[0],
        networks: row.networks,
        format: row.format,
        cover: "steam",
        status: "draft",
        scheduledDate: row.date,
        scheduledTime: row.time,
        assignee: profileName,
        pillar: "General",
      })
    );
    setImported(valid.length);
    setStep("listo");
  };

  const footer =
    step === "mapeo" ? (
      <>
        <span>{table.length - 1} filas encontradas</span>
        <button type="button" className="hubly-media-ghost" onClick={() => setStep("origen")}>Atrás</button>
        <button type="button" className="hubly-media-primary" disabled={mapping.title === undefined && mapping.caption === undefined} onClick={() => setStep("revision")}>Revisar</button>
      </>
    ) : step === "revision" ? (
      <>
        <span>{valid.length} listas · {review.filter((r) => r.errors.length).length} con errores · {review.filter((r) => r.duplicate).length} duplicadas</span>
        <button type="button" className="hubly-media-ghost" onClick={() => setStep("mapeo")}>Atrás</button>
        <button type="button" className="hubly-media-primary" disabled={valid.length === 0} onClick={confirm}>Importar {valid.length} como borradores</button>
      </>
    ) : step === "listo" ? (
      <button type="button" className="hubly-media-primary" style={{ marginLeft: "auto" }} onClick={onClose}>Listo</button>
    ) : undefined;

  return (
    <ModalShell title="Traer mi mes" subtitle="Crea borradores a partir de tu tabla. Nada se publica ni se comparte." onClose={onClose} footer={footer} wide>
      {error && <p className="hubly-media-notice" role="alert">{error}</p>}

      {step === "origen" && (
        <div className="hubly-import-source">
          <button type="button" className="hubly-media-ghost" onClick={() => fileRef.current?.click()}>Elegir archivo CSV o XLSX</button>
          <input ref={fileRef} type="file" hidden accept=".csv,.tsv,.txt,.xlsx" aria-label="Archivo a importar" onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ""; }} />
          <label>
            O pega tu tabla desde Excel, Sheets o Notion
            <textarea className="hubly-composer-caption" value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder={"Título\tFecha\tRedes\nLanzamiento\t2026-11-12\tInstagram, TikTok"} />
          </label>
          <button type="button" className="hubly-media-primary" disabled={!pasted.trim()} onClick={() => loadTable(parseDelimited(pasted))}>Continuar con lo pegado</button>
          <p className="hubly-media-hint">Notion y Asana exportan a CSV desde su menú de exportación. Interpretar imágenes o documentos, y conectar esas apps directamente, llegará en una entrega posterior.</p>
        </div>
      )}

      {step === "mapeo" && (
        <div className="hubly-import-map">
          <p className="hubly-media-hint">Indica qué columna corresponde a cada dato. Se necesita título o copy.</p>
          {IMPORT_FIELDS.map((field) => (
            <label key={field.id}>
              {field.label}
              <select
                className="hubly-social-cell"
                value={mapping[field.id] ?? ""}
                onChange={(e) => setMapping((m) => {
                  const next = { ...m };
                  if (e.target.value === "") delete next[field.id as ImportFieldId];
                  else next[field.id as ImportFieldId] = Number(e.target.value);
                  return next;
                })}
              >
                <option value="">No importar</option>
                {headers.map((header, index) => <option key={`${header}-${index}`} value={index}>{header || `Columna ${index + 1}`}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}

      {step === "revision" && (
        <>
          <label className="hubly-import-skip">
            <input type="checkbox" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} /> Omitir duplicados (mismo título y fecha)
          </label>
          <table className="hubly-social-table">
            <thead>
              <tr><th>Fila</th><th>Título</th><th>Fecha</th><th>Redes</th><th>Formato</th><th>Revisión</th></tr>
            </thead>
            <tbody>
              {review.map((row) => (
                <tr key={row.row} data-muted={row.errors.length > 0 || (skipDuplicates && row.duplicate) || undefined}>
                  <td>{row.row}</td>
                  <td>{row.title || "—"}</td>
                  <td>{row.date ? `${row.date}${row.time ? ` ${row.time}` : ""}` : "Sin fecha"}</td>
                  <td>{row.networks.join(", ")}</td>
                  <td>{row.format}</td>
                  <td>{row.errors.length ? <span style={{ color: STATUS_META.changes.color }}>{row.errors.join(" ")}</span> : row.duplicate ? "Duplicado" : "Lista"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {step === "listo" && <p>Se crearon {imported} borradores en {brand.name}. Revísalos en el calendario antes de enviarlos al cliente.</p>}
    </ModalShell>
  );
}
