"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { useLayer } from "@/lib/use-layer";
import { useModalPresence } from "@/lib/use-modal-presence";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { NotebookEditor } from "@/components/app/NotebookEditor";
import { STATUS_META } from "@/components/app/social/status-meta";
import { notebookPlainText, notebookTasks } from "@/lib/notebook-content";
import { dueLabelFor, localIsoDate } from "@/lib/date";
import {
  HublyCheckIcon as Check,
  HublyCloseIcon as X,
  HublyExternalIcon as ExternalLink,
  HublyNotebookIcon as BookOpen,
  HublyPlusIcon as Plus,
  HublySaveIcon as Save,
  HublyTrashIcon as Trash2,
} from "@/components/app/icons/DuotoneIcons";

export interface NotebookReaderModalProps {
  open?: boolean;
  notebookId?: string | null;
  onClose?: () => void;
  isFallbackMount?: boolean;
}

const NOTEBOOK_COLORS = [
  { id: "kraft", label: "Kraft clásico", bg: "#C59B6D", spine: "#3A2210" }, // ui-ok: ilustración de libreta kraft
  { id: "terracotta", label: "Terracota", bg: "#C87A51", spine: "#4A2511" }, // ui-ok: ilustración de libreta kraft
  { id: "sage", label: "Salvia", bg: "#4A7862", spine: "#1E382B" }, // ui-ok: ilustración de libreta kraft
  { id: "slate", label: "Pizarra", bg: "#475569", spine: "#1E293B" }, // ui-ok: ilustración de libreta kraft
];

let primaryNotebookModalMounts = 0;
const explicitNotebookOpenListeners = new Set<(id: string | null) => void>();
let storePatchedForNotebook = false;

function ensureStoreNotebookPatch() {
  if (storePatchedForNotebook || typeof window === "undefined") return;
  storePatchedForNotebook = true;
  const origSetActiveNotebookId = useHublyStore.getState().setActiveNotebookId;
  useHublyStore.setState({
    setActiveNotebookId: (notebookId: string | null) => {
      origSetActiveNotebookId(notebookId);
      explicitNotebookOpenListeners.forEach((fn) => fn(notebookId));
    },
  });
}

export function openNotebookModal(notebookId: string) {
  ensureStoreNotebookPatch();
  useHublyStore.getState().setActiveNotebookId(notebookId);
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const nodes = container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
  );
}

export function NotebookReaderModal({
  open: openProp,
  notebookId: notebookIdProp,
  onClose: onCloseProp,
  isFallbackMount = false,
}: NotebookReaderModalProps = {}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const autosaveRef = useRef<number | undefined>(undefined);

  const [suppressedAsFallback, setSuppressedAsFallback] = useState(false);
  const [explicitStoreOpen, setExplicitStoreOpen] = useState(false);

  useEffect(() => {
    ensureStoreNotebookPatch();
    const listener = (nextId: string | null) => {
      setExplicitStoreOpen(Boolean(nextId));
    };
    explicitNotebookOpenListeners.add(listener);
    return () => {
      explicitNotebookOpenListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!isFallbackMount) {
      primaryNotebookModalMounts += 1;
      return () => {
        primaryNotebookModalMounts = Math.max(0, primaryNotebookModalMounts - 1);
      };
    } else {
      setSuppressedAsFallback(primaryNotebookModalMounts > 0);
    }
  }, [isFallbackMount]);

  const notebooks = useHublyStore((s) => s.notebooks);
  const activeNotebookId = useHublyStore((s) => s.activeNotebookId);
  const setActiveNotebookId = useHublyStore((s) => s.setActiveNotebookId);
  const addNotebook = useHublyStore((s) => s.addNotebook);
  const updateNotebook = useHublyStore((s) => s.updateNotebook);
  const deleteNotebook = useHublyStore((s) => s.deleteNotebook);
  const brands = useHublyStore((s) => s.brands);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);

  const isOpen =
    !suppressedAsFallback &&
    (openProp !== undefined
      ? openProp
      : explicitStoreOpen && Boolean(activeNotebookId));

  const targetNotebookId =
    notebookIdProp !== undefined ? notebookIdProp : activeNotebookId;

  const currentNotebook =
    notebooks.find((n) => n.id === targetNotebookId) || notebooks[0] || null;

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("GUÍA DE AGENCIA");
  const [brandId, setBrandId] = useState(activeBrandId || "brand-min");
  const [accentColor, setAccentColor] = useState(NOTEBOOK_COLORS[0].bg);
  const [content, setContent] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);
  const [taskNotice, setTaskNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleClose = () => {
    if (!isCreatingNew && currentNotebook && title.trim() && title.trim() !== currentNotebook.title) {
      updateNotebook(currentNotebook.id, { title: title.trim() });
    }
    setErrorMsg(null);
    setSavedNotice(false);
    setIsCreatingNew(false);
    setExplicitStoreOpen(false);
    if (onCloseProp) {
      onCloseProp();
    } else {
      setActiveNotebookId(null);
    }
  };

  useLayer(isOpen, handleClose);

  // Sync form fields with active notebook
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSavedNotice(false);

    if (isCreatingNew || !currentNotebook) {
      setTitle("");
      setSubtitle("Notas operativas y acuerdos de cuenta");
      setCategory("ESTRATEGIA");
      setBrandId(activeBrandId || brands[0]?.id || "brand-min");
      setAccentColor(NOTEBOOK_COLORS[0].bg);
      setContent("");
    } else {
      setTitle(currentNotebook.title);
      setSubtitle(currentNotebook.subtitle || "Guía operativa de agencia");
      setCategory(
        currentNotebook.category || currentNotebook.stamp || "LIBRETA KRAFT"
      );
      setBrandId(currentNotebook.brandId || activeBrandId || "brand-min");
      setAccentColor(currentNotebook.accentColor || NOTEBOOK_COLORS[0].bg);
      setContent(currentNotebook.content);
    }
    // Solo al abrir o cambiar de libreta: el autoguardado actualiza currentNotebook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isCreatingNew, currentNotebook?.id]);

  // Focus trap, Initial focus & Scroll lock (Escape y retorno de foco en useLayer)
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const rafId = window.requestAnimationFrame(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      } else {
        const focusables = getFocusableElements(dialogRef.current);
        focusables[0]?.focus();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const focusables = getFocusableElements(dialogRef.current);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || active === first || !dialogRef.current?.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (!active || active === last || !dialogRef.current?.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", handleKeyDown, true);
      const remainingDialogs = document.querySelectorAll(
        '[role="dialog"][aria-modal="true"]'
      );
      if (remainingDialogs.length <= 1) {
        document.body.style.overflow = prevOverflow || "";
      }
    };
  }, [isOpen]);

  const presence = useModalPresence(isOpen);
  if (!presence.mounted) return null;

  const activeColorSpec =
    NOTEBOOK_COLORS.find((c) => c.bg === accentColor) || NOTEBOOK_COLORS[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    window.clearTimeout(autosaveRef.current);
    const cleanContent = notebookPlainText(content) ? content.trim() : "";

    if (!cleanTitle) {
      setErrorMsg("Escribe un título para esta libreta Kraft.");
      titleInputRef.current?.focus();
      return;
    }

    if (!cleanContent) {
      setErrorMsg("Agrega contenido o notas a la libreta antes de guardar.");
      return;
    }

    if (isCreatingNew || !currentNotebook) {
      const created = addNotebook({
        brandId,
        title: cleanTitle,
        subtitle: subtitle.trim() || "Notas operativas",
        category: category.trim().toUpperCase() || "LIBRETA KRAFT",
        accentColor,
        content: cleanContent,
      });
      setIsCreatingNew(false);
      setActiveNotebookId(created.id);
    } else {
      updateNotebook(currentNotebook.id, {
        brandId,
        title: cleanTitle,
        subtitle: subtitle.trim() || "Notas operativas",
        category: category.trim().toUpperCase() || "LIBRETA KRAFT",
        accentColor,
        content: cleanContent,
      });
    }

    setSavedNotice(true);
    setErrorMsg(null);
    window.setTimeout(() => setSavedNotice(false), 2400);
  };

  const sendPendingToTasks = () => {
    const state = useHublyStore.getState();
    const existing = new Set(state.tasks.filter((t) => t.brandId === brandId).map((t) => t.title));
    const fresh = notebookTasks(content).filter((t) => !existing.has(t));
    const today = localIsoDate();
    for (const title of fresh) {
      state.addTask({
        brandId,
        title,
        dueLabel: dueLabelFor(today),
        dueDate: today,
        assignee: state.profile?.name || "Equipo",
        listName: "Libretas",
        status: "todo",
        priority: "media",
      });
    }
    setTaskNotice(fresh.length === 0 ? "No hay pendientes nuevos." : `${fresh.length} enviados a Tareas.`);
    window.setTimeout(() => setTaskNotice(null), 2400);
  };

  const handleDeleteCurrent = () => {
    if (!currentNotebook || isCreatingNew) return;
    deleteNotebook(currentNotebook.id);
    const remaining = notebooks.filter((n) => n.id !== currentNotebook.id);
    if (remaining.length === 0) {
      handleClose();
    } else {
      setActiveNotebookId(remaining[0].id);
    }
  };

  return (
    <div
      className="hubly-overlay hubly-cal-overlay"
      data-state={presence.state}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        zIndex: "var(--layer-modal)",
      }}
    >
      <div
        ref={dialogRef}
        className="hubly-sheet hubly-cal-modal"
        data-state={presence.state}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          width: "100%",
          maxWidth: 780,
          maxHeight: "90vh",
          padding: 0,
          gap: 0,
          background: "var(--ui-surface)",
          borderRadius: 24,
          border: "1px solid var(--ui-border)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "var(--ui-text)",
          position: "relative",
        }}
      >
        {/* Left Kraft Spine Band */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 12,
            background: activeColorSpec.spine,
            zIndex: 2,
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: "16px 24px 14px 32px",
            background: "var(--ui-surface-2)",
            borderBottom: "1px solid var(--ui-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: activeColorSpec.bg,
                color: "var(--on-accent)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <BookOpen size={17} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "var(--ui-muted)",
                    color: "var(--ui-text-3)",
                  }}
                >
                  {category || "LIBRETA KRAFT"}
                </span>
                {savedNotice && (
                  <span
                    role="status"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: STATUS_META.approved.color,
                      background: STATUS_META.approved.bg,
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}
                  >
                    <Check size={11} /> Guardado en Mi espacio
                  </span>
                )}
              </div>
              <h2
                id={titleId}
                style={{
                  margin: "2px 0 0",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--ui-text)",
                }}
              >
                {isCreatingNew
                  ? "Nueva libreta Kraft"
                  : currentNotebook?.title || "Lector de libretas"}
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HublyCatAvatar size={26} />
            <button
              type="button"
              className="hubly-cal-modal-close"
              onClick={handleClose}
              aria-label="Cerrar lector de libreta"
              title="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content Area: Sidebar List + Reader/Editor */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            paddingLeft: 12,
          }}
        >
          {/* Left Notebook Switcher */}
          <div
            style={{
              flex: "1 1 190px",
              background: "var(--ui-surface-2)",
              borderRight: "1px solid var(--ui-border)",
              borderBottom: "1px solid var(--ui-border)",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--ui-text-4)",
                }}
              >
                Mis libretas ({notebooks.length})
              </span>
              <button
                type="button"
                className={isCreatingNew ? "hbtn hbtn-xs hbtn-primary" : "hbtn hbtn-xs hbtn-secondary"}
                onClick={() => setIsCreatingNew(true)}
              >
                <Plus size={12} /> Nueva
              </button>
            </div>

            {notebooks.map((nb) => {
              const selected =
                !isCreatingNew && currentNotebook?.id === nb.id;
              return (
                <button
                  key={nb.id}
                  aria-pressed={selected}
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setActiveNotebookId(nb.id);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: selected
                      ? "1px solid var(--ui-sky-border)"
                      : "1px solid transparent",
                    background: selected ? "var(--ui-sky-soft)" : "transparent",
                    color: selected ? "var(--ui-sky-text)" : "var(--ui-text)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      color: "var(--ui-text-4)",
                      textTransform: "uppercase",
                    }}
                  >
                    {nb.category || nb.stamp || "LIBRETA"}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: selected ? 700 : 500,
                      lineHeight: 1.25,
                    }}
                  >
                    {nb.title}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--ui-text-4)" }}>
                    Actualizado:{" "}
                    {new Date(nb.updatedAt).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Form Reader / Editor */}
          <form
            id="notebook-reader-form"
            onSubmit={handleSave}
            style={{
              flex: "999 1 360px",
              minWidth: 0,
              padding: "16px 24px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {errorMsg && (
              <div
                role="alert"
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: STATUS_META.changes.bg,
                  border: "1px solid var(--ui-border)",
                  color: STATUS_META.changes.color,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {errorMsg}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 10,
              }}
            >
              <div>
                <label
                  htmlFor="nb-title-input"
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--ui-text-4)",
                    marginBottom: 6,
                  }}
                >
                  Título de la libreta *
                </label>
                <input
                  ref={titleInputRef}
                  id="nb-title-input"
                  type="text"
                  autoFocus
                  aria-invalid={Boolean(errorMsg && !title.trim())}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Ej. Guía de onboarding y tono de marca"
                  style={{
                    width: "100%",
                    height: 36,
                    padding: "0 12px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--ui-text)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="nb-brand-select"
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--ui-text-4)",
                    marginBottom: 6,
                  }}
                >
                  Marca vinculada
                </label>
                <select
                  id="nb-brand-select"
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  style={{
                    width: "100%",
                    height: 36,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ui-text)",
                  }}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.handle})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              <div>
                <label
                  htmlFor="nb-subtitle-input"
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--ui-text-4)",
                    marginBottom: 6,
                  }}
                >
                  Subtítulo / Resumen
                </label>
                <input
                  id="nb-subtitle-input"
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Resumen corto para la portada Kraft"
                  style={{
                    width: "100%",
                    height: 36,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
                    fontSize: 13,
                    color: "var(--ui-text)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="nb-badge-input"
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--ui-text-4)",
                    marginBottom: 6,
                  }}
                >
                  Etiqueta
                </label>
                <input
                  id="nb-badge-input"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    height: 36,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid var(--ui-border-strong)",
                    background: "var(--ui-surface)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--ui-text)",
                  }}
                />
              </div>
            </div>

            {/* Cover Color Selector */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ui-text-4)",
                }}
              >
                Cubierta del cuaderno:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {NOTEBOOK_COLORS.map((c) => {
                  const active = accentColor === c.bg;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAccentColor(c.bg)}
                      aria-pressed={active}
                      aria-label={c.label}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: active
                          ? "1.5px solid var(--hb-accent)"
                          : "1px solid var(--ui-border-strong)",
                        background: active ? c.bg : "var(--ui-surface)",
                        color: active ? "var(--on-accent)" : "var(--ui-text-2)",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--ui-text-4)",
                  marginBottom: 6,
                }}
              >
                Contenido y notas operativas *
              </span>
              <NotebookEditor
                key={isCreatingNew ? "nueva" : currentNotebook?.id || "vacia"}
                initialContent={isCreatingNew ? "" : currentNotebook?.content || ""}
                onChange={(html) => {
                  setContent(html);
                  if (errorMsg) setErrorMsg(null);
                  if (!isCreatingNew && currentNotebook) {
                    const id = currentNotebook.id;
                    window.clearTimeout(autosaveRef.current);
                    autosaveRef.current = window.setTimeout(() => updateNotebook(id, { content: html }), 500);
                  }
                }}
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "12px 24px 12px 32px",
            background: "var(--ui-surface-2)",
            borderTop: "1px solid var(--ui-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <Link
              href="/tareas?seccion=libretas"
              onClick={handleClose}
              className="hb-widget-link"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                fontWeight: 600,
                color: "var(--hb-accent-text)",
                textDecoration: "none",
              }}
            >
              <span>Abrir en Mi espacio</span>
              <ExternalLink size={14} />
            </Link>

            <button
              type="button"
              className="hbtn hbtn-sm hbtn-secondary"
              onClick={sendPendingToTasks}
            >
              Enviar pendientes a Tareas
            </button>
            {taskNotice && (
              <span role="status" style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ui-text-3)" }}>
                {taskNotice}
              </span>
            )}

            {!isCreatingNew && currentNotebook && notebooks.length > 1 && (
              <button
                type="button"
                className="hbtn hbtn-sm hbtn-danger"
                aria-label="Eliminar libreta"
                onClick={handleDeleteCurrent}
              >
                <Trash2 size={14} />
                <span>Eliminar libreta</span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              className="hbtn hbtn-ghost"
              onClick={handleClose}
            >
              Cerrar
            </button>

            <button
              type="submit"
              form="notebook-reader-form"
              className="hbtn hbtn-primary"
            >
              <Save size={15} />
              <span>
                {isCreatingNew ? "Crear libreta Kraft" : "Guardar cambios"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotebookReaderModal;
