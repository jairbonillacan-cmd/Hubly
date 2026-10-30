"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
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
import { useModalPresence } from "@/lib/use-modal-presence";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import type { PostStatus, PostStatusLabel, SocialNetwork } from "@/lib/types";

export interface PostComposerModalProps {
  open?: boolean;
  onClose?: () => void;
  initialPostId?: string | null;
  defaultBrandId?: string;
}

type ComposerTab = "contenido" | "notas" | "todos" | "documentos" | "chat" | "actividad";

const TABS: { id: ComposerTab; label: string; Icon: typeof ImageIcon }[] = [
  { id: "contenido", label: "Contenido", Icon: ImageIcon },
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
  const [todos, setTodos] = useState<{ id: number; text: string; done: boolean }[]>([]);
  const [todoDraft, setTodoDraft] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const brandId = editingPost?.brandId || defaultBrandId || activeBrandId;
  const brand = brands.find((b) => b.id === brandId) || brands[0];
  const handle = brand?.handle || "tu_marca";
  const previewNetwork = networks[0] || "Instagram";

  const handleClose = () => {
    setErrorMsg(null);
    if (onCloseProp) onCloseProp();
    else closeComposer();
  };

  useEffect(() => {
    if (!isOpen) return;
    setTab("contenido");
    setErrorMsg(null);
    setNotes("");
    setTodos([]);
    setMediaUrl(null);
    setTitle(editingPost?.title || "");
    setCaption(editingPost?.caption || "");
    setNetworks(editingPost?.networks?.length ? editingPost.networks : ["Instagram"]);
    setStatus(editingPost?.status || "pending");
    setScheduledDate(editingPost?.scheduledDate || new Date().toISOString().slice(0, 10));
    setScheduledTime(editingPost?.scheduledTime || "11:30");
  }, [isOpen, editingPost]);

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

  const save = (finalStatus: PostStatus) => {
    if (finalStatus === "scheduled" && !caption.trim()) {
      setErrorMsg("Escribe el caption antes de programar.");
      return;
    }
    const finalLabel = finalStatus === "draft" ? "Borrador" : finalStatus === "scheduled" ? "Programado" : statusOption.label;
    savePost({
      id: editingPost?.id,
      brandId,
      title: title.trim() || "Sin título",
      caption: caption.trim(),
      network: networks[0],
      networks,
      format: editingPost?.format || "Carrusel",
      cover: editingPost?.cover || "steam",
      status: finalStatus,
      statusLabel: finalLabel,
      scheduledDate,
      scheduledTime,
      assignee: editingPost?.assignee || profile?.name || "Jair",
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
          <button type="button">
            <User size={14} />
            <span>{editingPost?.assignee || "Sin asignar"}</span>
          </button>
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
                    <strong>Para que salga, conecta las redes de {brand?.name || "tu marca"}</strong>
                    <span>Tu post se guarda mientras tanto.</span>
                  </div>
                  <button
                    type="button"
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
                  <button type="button" onClick={() => fileRef.current?.click()}>
                    <span><Upload size={18} /></span>
                    <strong>Arrastra archivos aquí o <b>haz clic</b></strong>
                    <small>Imágenes y videos · máx 10 archivos</small>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      router.push("/archivos");
                    }}
                  >
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
                      const file = e.target.files?.[0];
                      if (file) setMediaUrl(URL.createObjectURL(file));
                    }}
                  />
                </div>

                <span className="hubly-composer-chip">General</span>
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

            {tab === "notas" && (
              <textarea
                className="hubly-composer-caption"
                style={{ minHeight: 280 }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
                      onChange={() => setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)))}
                    />
                    <span>{todo.text}</span>
                  </label>
                ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!todoDraft.trim()) return;
                    setTodos((prev) => [...prev, { id: Date.now(), text: todoDraft.trim(), done: false }]);
                    setTodoDraft("");
                  }}
                >
                  <input className="hubly-cal-input" value={todoDraft} onChange={(e) => setTodoDraft(e.target.value)} placeholder="Agregar tarea…" aria-label="Nueva tarea del post" />
                </form>
              </div>
            )}

            {(tab === "documentos" || tab === "chat") && (
              <div className="hubly-cal-empty">
                <strong>{tab === "documentos" ? "Sin documentos" : "Sin mensajes"}</strong>
                <span>Función prevista.</span>
              </div>
            )}

            {tab === "actividad" && (
              <div className="hubly-cal-empty">
                <strong>{editingPost ? "Post creado" : "Aún sin actividad"}</strong>
                <span>{editingPost ? `Última programación: ${editingPost.scheduledDate}` : "El historial empieza al guardar."}</span>
              </div>
            )}
          </div>

          <aside className="hubly-composer-preview">
            <span className="hubly-composer-network-pill">{previewNetwork}</span>
            <div className="hubly-composer-phone">
              <div className="hubly-composer-notch" />
              <div className="hubly-composer-phone-head"><b>{previewNetwork}</b></div>
              <div className="hubly-composer-phone-user"><i />{handle.replace("@", "")}</div>
              <div className="hubly-composer-phone-media">
                {mediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl} alt="Vista previa" />
                ) : (
                  <span><Play size={14} /><small>Sin media</small></span>
                )}
              </div>
              <p><b>{handle.replace("@", "")}</b> {caption || "Escribe tu caption…"}</p>
            </div>
            <small>{previewNetwork} Post · 1:1</small>
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
          <button type="button" className="hbtn hbtn-primary" onClick={() => save("scheduled")}>
            Programar
          </button>
        </footer>
      </div>
    </div>
  );
}

export default PostComposerModal;
