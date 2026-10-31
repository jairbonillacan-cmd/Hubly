"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BarChart2,
  Bell,
  CheckSquare,
  Cloud,
  Palette,
  FileText,
  Image as ImageIcon,
  Library,
  MessageCircle,
  NotebookPen,
  Play,
  Plus,
  Upload,
  User,
  X,
} from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { localIsoDate } from "@/lib/date";
import { backendEnabled } from "@/lib/supabase/config";
import { CaptionAssistant, ManualResults } from "@/components/app/social/ComposerExtras";
import { useModalPresence } from "@/lib/use-modal-presence";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { Cover, type CoverKind } from "@/components/Cover";
import { SocialPreview } from "@/components/previews/SocialPreview";
import {
  networkToPlatform,
  POST_PREVIEW_CONFIG,
  socialPostToPreview,
} from "@/components/previews/from-social-post";
import type {
  PostChatMessage,
  PostDocument,
  PostFormat,
  PostStatus,
  PostStatusLabel,
  PostTodo,
  SocialNetwork,
} from "@/lib/types";

const FORMATS: PostFormat[] = ["Imagen", "Carrusel", "Reel / Video", "Story", "Texto"];

/** Reduce la imagen: se guarda dentro del workspace hasta que exista almacenamiento real. */
function imageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagen no válida"));
    };
    img.src = url;
  });
}

export interface PostComposerModalProps {
  open?: boolean;
  onClose?: () => void;
  initialPostId?: string | null;
  defaultBrandId?: string;
}

type ComposerTab = "contenido" | "resultados" | "notas" | "todos" | "documentos" | "chat" | "actividad";

const TABS: { id: ComposerTab; label: string; Icon: typeof ImageIcon }[] = [
  { id: "contenido", label: "Contenido", Icon: ImageIcon },
  { id: "resultados", label: "Resultados", Icon: BarChart2 },
  { id: "notas", label: "Notas", Icon: NotebookPen },
  { id: "todos", label: "To-Dos", Icon: CheckSquare },
  { id: "documentos", label: "Documentos", Icon: FileText },
  { id: "chat", label: "Chat", Icon: MessageCircle },
  { id: "actividad", label: "Actividad", Icon: Activity },
];

const NETWORKS: { id: SocialNetwork; glyph: React.ReactNode }[] = [
  {
    id: "Instagram",
    glyph: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  { id: "Facebook", glyph: "f" },
  { id: "TikTok", glyph: "♪" },
  { id: "LinkedIn", glyph: "in" },
  { id: "YouTube", glyph: <Play size={15} fill="currentColor" /> },
  { id: "X", glyph: "X" },
  { id: "Threads", glyph: "@" },
  { id: "Pinterest", glyph: "P" },
];

const STATUS_OPTIONS: { value: PostStatus; label: PostStatusLabel; text: string }[] = [
  { value: "draft", label: "Borrador", text: "Borrador" },
  { value: "pending", label: "En aprobación", text: "Pendiente de revisión" },
  { value: "changes", label: "Requiere cambios", text: "Cambios solicitados" },
  { value: "approved", label: "Programado", text: "Aprobado" },
  { value: "scheduled", label: "Programado", text: "Programado" },
];

export function PostComposerModal({
  open: openProp,
  onClose: onCloseProp,
  initialPostId,
  defaultBrandId,
}: PostComposerModalProps = {}) {
  const router = useRouter();
  const titleId = useId();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const composerOpen = useHublyStore((s) => s.composerOpen);
  const editingPostId = useHublyStore((s) => s.editingPostId);
  const closeComposer = useHublyStore((s) => s.closeComposer);
  const posts = useHublyStore((s) => s.posts);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const profile = useHublyStore((s) => s.profile);
  const savePost = useHublyStore((s) => s.savePost);
  const patchPost = useHublyStore((s) => s.patchPost);
  const team = useHublyStore((s) => s.team);
  const assets = useHublyStore((s) => s.assets);
  const composerDefaultDate = useHublyStore((s) => s.composerDefaultDate);

  const isOpen = openProp !== undefined ? openProp : composerOpen;
  const presence = useModalPresence(isOpen);
  const targetPostId = initialPostId !== undefined ? initialPostId : editingPostId;
  const editingPost = targetPostId ? posts.find((p) => p.id === targetPostId) || null : null;

  const [tab, setTab] = useState<ComposerTab>("contenido");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [networks, setNetworks] = useState<SocialNetwork[]>(["Instagram"]);
  const [status, setStatus] = useState<PostStatus>("pending");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("11:30");
  const [notifyOnPublish, setNotifyOnPublish] = useState(false);
  const [notes, setNotes] = useState("");
  const [todos, setTodos] = useState<PostTodo[]>([]);
  const [todoDraft, setTodoDraft] = useState("");
  const [documents, setDocuments] = useState<PostDocument[]>([]);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [chat, setChat] = useState<PostChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [cover, setCover] = useState<CoverKind>("steam");
  const [format, setFormat] = useState<PostFormat>("Carrusel");
  const [assignee, setAssignee] = useState("");
  const [previewNet, setPreviewNet] = useState<SocialNetwork | null>(null);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const brandId = editingPost?.brandId || defaultBrandId || activeBrandId;
  const brand = brands.find((b) => b.id === brandId) || brands[0];
  const handle = brand?.handle || "tu_marca";
  const previewNetwork = previewNet && networks.includes(previewNet) ? previewNet : networks[0] || "Instagram";
  const previewPlatform = networkToPlatform(previewNetwork);
  const brandAssets = assets.filter((a) => a.brandId === brandId && (a.kind === "image" || a.kind === "video"));
  const authorName = profile?.name || "Equipo";
  const assigneeOptions = Array.from(new Set([assignee, ...team.map((m) => m.name)].filter(Boolean)));

  const handleClose = () => {
    setErrorMsg(null);
    if (onCloseProp) onCloseProp();
    else closeComposer();
  };

  useEffect(() => {
    if (!isOpen) return;
    setTab("contenido");
    setErrorMsg(null);
    setNotes(editingPost?.notes || "");
    setTodos(editingPost?.todos || []);
    setDocuments(editingPost?.documents || []);
    setChat(editingPost?.chat || []);
    setTodoDraft("");
    setDocName("");
    setDocUrl("");
    setChatDraft("");
    setMediaUrl(editingPost?.mediaUrl || null);
    setCover(editingPost?.cover || "steam");
    setFormat(editingPost?.format || "Carrusel");
    setAssignee(editingPost?.assignee || profile?.name || "");
    setNotifyOnPublish(editingPost?.notifyOnPublish || false);
    setPreviewNet(null);
    setAssetsOpen(false);
    setTitle(editingPost?.title || "");
    setCaption(editingPost?.caption || "");
    setNetworks(editingPost?.networks?.length ? editingPost.networks : ["Instagram"]);
    setStatus(editingPost?.status || "pending");
    setScheduledDate(editingPost?.scheduledDate || composerDefaultDate || localIsoDate());
    setScheduledTime(editingPost?.scheduledTime || "11:30");
    // Solo al abrir o cambiar de post: patchPost actualiza editingPost mientras se escribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingPost?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!presence.mounted) return null;

  const statusOption = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[1];

  const toggleNetwork = (network: SocialNetwork) =>
    setNetworks((prev) =>
      prev.includes(network) ? (prev.length > 1 ? prev.filter((n) => n !== network) : prev) : [...prev, network]
    );

  const updateTodos = (next: PostTodo[]) => {
    setTodos(next);
    if (editingPost) patchPost(editingPost.id, { todos: next });
  };
  const updateDocuments = (next: PostDocument[]) => {
    setDocuments(next);
    if (editingPost) patchPost(editingPost.id, { documents: next });
  };
  const updateChat = (next: PostChatMessage[]) => {
    setChat(next);
    if (editingPost) patchPost(editingPost.id, { chat: next });
  };
  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Por ahora solo se pueden subir imágenes.");
      return;
    }
    try {
      setMediaUrl(await imageToDataUrl(file));
      setErrorMsg(null);
    } catch {
      setErrorMsg("No se pudo leer esa imagen.");
    }
  };

  const save = (finalStatus: PostStatus) => {
    if ((finalStatus === "scheduled" || finalStatus === "pending") && !caption.trim()) {
      setErrorMsg(finalStatus === "scheduled" ? "Escribe el caption antes de programar." : "Escribe el caption antes de enviar a revisión.");
      return;
    }
    const finalLabel = finalStatus === "draft" ? "Borrador" : finalStatus === "scheduled" ? "Programado" : finalStatus === "pending" ? "En aprobación" : statusOption.label;
    savePost({
      id: editingPost?.id,
      brandId,
      title: title.trim() || "Sin título",
      caption: caption.trim(),
      network: networks[0],
      networks,
      format,
      cover,
      mediaUrl: mediaUrl || undefined,
      notifyOnPublish,
      notes,
      todos,
      documents,
      chat,
      activity: editingPost?.activity,
      status: finalStatus,
      statusLabel: finalLabel,
      scheduledDate,
      scheduledTime,
      assignee: assignee || authorName,
      pillar: editingPost?.pillar || "General",
    });
    handleClose();
  };

  return (
    <div
      className="hubly-overlay hubly-composer-overlay"
      data-state={presence.state}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="hubly-sheet hubly-composer"
        data-state={presence.state}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="hubly-composer-head">
          <div style={{ minWidth: 0, flex: 1 }}>
            <input
              id={titleId}
              className="hubly-composer-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sin título"
              aria-label="Título del post"
            />
            <div className="hubly-composer-badges">
              <span>{status === "draft" || !editingPost ? "Borrador" : statusOption.label}</span>
              <em>{statusOption.text}</em>
            </div>
          </div>
          <button type="button" className="hubly-cal-icon" aria-label="Cerrar" onClick={handleClose}>
            <X size={18} />
          </button>
        </header>

        <div className="hubly-composer-meta">
          <label>
            <User size={14} />
            <select aria-label="Responsable" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              {assigneeOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <button type="button" aria-pressed={notifyOnPublish} onClick={() => setNotifyOnPublish((v) => !v)}>
            <Bell size={14} />
            <span>Avisar al publicar</span>
          </button>
          <button type="button" disabled title="Función prevista">
            <Palette size={14} />
            <span>Color</span>
          </button>
          <label>
            <i />
            <select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value as PostStatus)}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.text}
                </option>
              ))}
            </select>
          </label>
          <button type="button" aria-label="Agregar campo" title="Función prevista" disabled>
            <Plus size={14} />
          </button>
        </div>

        <nav className="hubly-composer-tabs" aria-label="Secciones del post">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-current={tab === id ? "true" : undefined} onClick={() => setTab(id)}>
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="hubly-composer-body">
          <div className="hubly-composer-main">
            {tab === "contenido" && (
              <>
                <div className="hubly-composer-banner">
                  <HublyCatAvatar size={36} />
                  <div>
                    <strong>{backendEnabled ? "La publicación automática llegará pronto" : `Para que salga, conecta las redes de ${brand?.name || "tu marca"}`}</strong>
                    <span>{backendEnabled ? "Por ahora publica en la red y regístralo en Resultados." : "Tu post se guarda mientras tanto."}</span>
                  </div>
                  <button
                    type="button"
                    hidden={backendEnabled}
                    className="hbtn hbtn-primary hbtn-sm"
                    onClick={() => {
                      handleClose();
                      router.push("/ajustes");
                    }}
                  >
                    Conectar
                  </button>
                </div>

                <div className="hubly-composer-networks" role="group" aria-label="Redes">
                  {NETWORKS.map(({ id, glyph }) => (
                    <button key={id} type="button" title={id} aria-label={id} aria-pressed={networks.includes(id)} onClick={() => toggleNetwork(id)}>
                      {glyph}
                    </button>
                  ))}
                </div>

                <div className="hubly-composer-sources">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      void handleFile(e.dataTransfer.files?.[0]);
                    }}
                  >
                    <span><Upload size={18} /></span>
                    <strong>Arrastra una imagen aquí o <b>haz clic</b></strong>
                    <small>{mediaUrl ? "Imagen lista · haz clic para cambiarla" : "Una imagen por post"}</small>
                  </button>
                  <button type="button" aria-expanded={assetsOpen} onClick={() => setAssetsOpen((v) => !v)}>
                    <span><Library size={18} /></span>
                    <strong>Elegir del <b>Content Manager</b></strong>
                    <small>Assets ya subidos de la marca</small>
                  </button>
                  <button type="button" disabled title="Función prevista">
                    <span><Palette size={18} /></span>
                    <strong>Traer de <b>Canva</b></strong>
                    <small>Función prevista</small>
                  </button>
                  <button type="button" disabled title="Función prevista">
                    <span><Cloud size={18} /></span>
                    <strong>Traer de <b>Drive</b></strong>
                    <small>Función prevista</small>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    aria-label="Subir archivo"
                    onChange={(e) => {
                      void handleFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </div>

                {assetsOpen && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 8 }}>
                    {brandAssets.length === 0 && (
                      <span style={{ fontSize: 12.5, color: "var(--ui-text-4)" }}>Esta marca aún no tiene archivos.</span>
                    )}
                    {brandAssets.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        title={asset.name}
                        aria-pressed={!mediaUrl && cover === asset.cover}
                        onClick={() => {
                          setCover(asset.cover);
                          setMediaUrl(null);
                          setAssetsOpen(false);
                        }}
                        style={{ border: "1px solid var(--ui-border)", borderRadius: 10, padding: 0, overflow: "hidden", background: "var(--ui-surface)", cursor: "pointer", font: "inherit", textAlign: "left" }}
                      >
                        <span style={{ display: "block", height: 64, overflow: "hidden" }}><Cover kind={asset.cover} /></span>
                        <small style={{ display: "block", padding: "4px 6px", fontSize: 10.5, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{asset.name}</small>
                      </button>
                    ))}
                  </div>
                )}

                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600 }}>
                  Formato
                  <select className="hubly-cal-input" value={format} onChange={(e) => setFormat(e.target.value as PostFormat)}>
                    {FORMATS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </label>

                <CaptionAssistant
                  brand={brand}
                  network={previewNetwork}
                  format={format}
                  onUse={setCaption}
                />
                <textarea
                  className="hubly-composer-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escribe el caption aquí…"
                  aria-label="Caption"
                />

                <div className="hubly-composer-schedule">
                  <label>
                    Fecha
                    <input className="hubly-cal-input" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                  </label>
                  <label>
                    Hora
                    <input className="hubly-cal-input" type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
                  </label>
                </div>
              </>
            )}

            {tab === "resultados" && editingPost && (backendEnabled || editingPost.metricsSource === "manual") && (
              <ManualResults key={editingPost.id} post={editingPost} />
            )}

            {tab === "resultados" && !(editingPost && (backendEnabled || editingPost.metricsSource === "manual")) && (
              editingPost?.metrics ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ui-accent-text)" }}>Datos de ejemplo</span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
                    {[
                      ["Alcance", editingPost.metrics.reach],
                      ["Me gusta", editingPost.metrics.likes],
                      ["Comentarios", editingPost.metrics.comments],
                      ["Guardados", editingPost.metrics.saves],
                      ["Compartidos", editingPost.metrics.shares],
                    ].map(([label, value]) => (
                      <div key={label} style={{ border: "1px solid var(--ui-border)", borderRadius: 12, padding: 12 }}>
                        <div style={{ fontSize: 11.5, color: "var(--ui-text-4)" }}>{label}</div>
                        <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value.toLocaleString("es-MX")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="hubly-cal-empty">
                  <strong>Sin resultados</strong>
                  <span>Aparecerán cuando el post se publique desde una cuenta conectada.</span>
                </div>
              )
            )}

            {tab === "notas" && (
              <textarea
                className="hubly-composer-caption"
                style={{ minHeight: 280 }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => {
                  if (editingPost) patchPost(editingPost.id, { notes });
                }}
                placeholder="Notas internas del equipo. No se publican."
                aria-label="Notas"
              />
            )}

            {tab === "todos" && (
              <div className="hubly-composer-todos">
                {todos.map((todo) => (
                  <label key={todo.id}>
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={() => updateTodos(todos.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)))}
                    />
                    <span>{todo.text}</span>
                  </label>
                ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!todoDraft.trim()) return;
                    updateTodos([...todos, { id: `todo-${Date.now()}`, text: todoDraft.trim(), done: false }]);
                    setTodoDraft("");
                  }}
                >
                  <input className="hubly-cal-input" value={todoDraft} onChange={(e) => setTodoDraft(e.target.value)} placeholder="Agregar tarea…" aria-label="Nueva tarea del post" />
                </form>
              </div>
            )}

            {tab === "documentos" && (
              <div style={{ display: "grid", gap: 10 }}>
                {documents.length === 0 && (
                  <span style={{ fontSize: 13, color: "var(--ui-text-4)" }}>Agrega enlaces a briefs, guiones o archivos de referencia.</span>
                )}
                {documents.map((doc) => (
                  <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--ui-border)", borderRadius: 10, padding: "8px 10px", fontSize: 13 }}>
                    <FileText size={14} />
                    <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, color: "var(--ui-accent-text-2)", fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                      {doc.name}
                    </a>
                    <button type="button" aria-label={`Quitar ${doc.name}`} onClick={() => updateDocuments(documents.filter((d) => d.id !== doc.id))} style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--ui-text-4)", display: "grid" }}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <form
                  style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const url = docUrl.trim();
                    if (!/^https?:\/\//i.test(url)) {
                      setErrorMsg("El enlace debe empezar con http:// o https://");
                      return;
                    }
                    setErrorMsg(null);
                    updateDocuments([...documents, { id: `doc-${Date.now()}`, name: docName.trim() || url, url }]);
                    setDocName("");
                    setDocUrl("");
                  }}
                >
                  <input className="hubly-cal-input" style={{ flex: "1 1 130px", minWidth: 0 }} value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Nombre" aria-label="Nombre del documento" />
                  <input className="hubly-cal-input" style={{ flex: "2 1 180px", minWidth: 0 }} value={docUrl} onChange={(e) => setDocUrl(e.target.value)} placeholder="https://…" aria-label="Enlace del documento" />
                  <button type="submit" className="hbtn hbtn-secondary hbtn-sm">Agregar</button>
                </form>
              </div>
            )}

            {tab === "chat" && (
              <div style={{ display: "grid", gap: 8 }}>
                {chat.length === 0 && <span style={{ fontSize: 13, color: "var(--ui-text-4)" }}>Conversación interna del equipo sobre este post.</span>}
                {chat.map((m) => (
                  <div key={m.id} style={{ background: "var(--ui-muted)", borderRadius: 12, padding: "8px 11px", fontSize: 13 }}>
                    <strong style={{ display: "block", fontSize: 12 }}>
                      {m.author} · <small style={{ fontWeight: 400 }}>{new Date(m.at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</small>
                    </strong>
                    {m.text}
                  </div>
                ))}
                <form
                  style={{ display: "flex", gap: 8 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!chatDraft.trim()) return;
                    updateChat([...chat, { id: `msg-${Date.now()}`, author: authorName, text: chatDraft.trim(), at: new Date().toISOString() }]);
                    setChatDraft("");
                  }}
                >
                  <input className="hubly-cal-input" style={{ flex: 1, minWidth: 0 }} value={chatDraft} onChange={(e) => setChatDraft(e.target.value)} placeholder="Escribe un mensaje…" aria-label="Mensaje al equipo" />
                  <button type="submit" className="hbtn hbtn-secondary hbtn-sm">Enviar</button>
                </form>
              </div>
            )}

            {tab === "actividad" && (
              editingPost?.activity?.length ? (
                <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                  {editingPost.activity.map((entry) => (
                    <li key={entry.id} style={{ fontSize: 13, borderLeft: "2px solid #D9DCF0", paddingLeft: 10 }}>
                      <strong>{entry.author}</strong> {entry.text}
                      <small style={{ display: "block", color: "var(--ui-text-4)" }}>
                        {new Date(entry.at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                      </small>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="hubly-cal-empty">
                  <strong>Aún sin actividad</strong>
                  <span>El historial empieza al guardar cambios en este post.</span>
                </div>
              )
            )}
          </div>

          <aside className="hubly-composer-preview">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
              {networks.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="hubly-composer-network-pill"
                  aria-pressed={n === previewNetwork}
                  onClick={() => setPreviewNet(n)}
                  style={{ border: 0, cursor: "pointer", opacity: n === previewNetwork ? 1 : 0.55 }}
                >
                  {n}
                </button>
              ))}
            </div>
            {previewPlatform ? (
              <SocialPreview
                key={previewPlatform}
                post={socialPostToPreview(
                  { id: editingPost?.id || "nuevo", caption: caption || "Escribe tu caption…", format, cover, mediaUrl: mediaUrl || undefined, scheduledDate },
                  brand,
                  previewPlatform
                )}
                config={POST_PREVIEW_CONFIG}
              />
            ) : (
              <div className="hubly-composer-phone">
                <div className="hubly-composer-notch" />
                <div className="hubly-composer-phone-head"><b>{previewNetwork}</b></div>
                <div className="hubly-composer-phone-user"><i />{handle.replace("@", "")}</div>
                <div className="hubly-composer-phone-media">
                  {mediaUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl} alt="Vista previa" />
                  ) : (
                    <Cover kind={cover} />
                  )}
                </div>
                <p><b>{handle.replace("@", "")}</b> {caption || "Escribe tu caption…"}</p>
              </div>
            )}
            <small>{previewNetwork} · {format}</small>
          </aside>
        </div>

        <footer className="hubly-composer-foot">
          {errorMsg && <span role="alert">{errorMsg}</span>}
          <button type="button" className="hbtn hbtn-ghost" onClick={handleClose}>
            Cancelar
          </button>
          <button type="button" className="hbtn hbtn-secondary" onClick={() => save("draft")}>
            Guardar borrador
          </button>
          <button type="button" className="hbtn hbtn-secondary" onClick={() => save("pending")}>
            Enviar a revisión
          </button>
          <button type="button" className="hbtn hbtn-primary" onClick={() => save("scheduled")}>
            Programar
          </button>
        </footer>
      </div>
    </div>
  );
}

export default PostComposerModal;
