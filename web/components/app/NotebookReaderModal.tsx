"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useHublyStore } from "@/lib/store";
import { useModalPresence } from "@/lib/use-modal-presence";
import { HublyCatAvatar } from "@/components/app/icons/HublyIcons";
import { NotebookEditor } from "@/components/app/NotebookEditor";
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
  { id: "kraft", label: "Kraft clásico", bg: "#C59B6D", spine: "#3A2210" },
  { id: "terracotta", label: "Terracota", bg: "#C87A51", spine: "#4A2511" },
  { id: "sage", label: "Salvia", bg: "#4A7862", spine: "#1E382B" },
  { id: "slate", label: "Pizarra", bg: "#475569", spine: "#1E293B" },
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
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

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
  const [accentColor, setAccentColor] = useState("#C59B6D");
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
      setAccentColor("#C59B6D");
      setContent("");
    } else {
      setTitle(currentNotebook.title);
      setSubtitle(currentNotebook.subtitle || "Guía operativa de agencia");
      setCategory(
        currentNotebook.category || currentNotebook.stamp || "LIBRETA KRAFT"
      );
      setBrandId(currentNotebook.brandId || activeBrandId || "brand-min");
      setAccentColor(currentNotebook.accentColor || "#C59B6D");
      setContent(currentNotebook.content);
    }
    // Solo al abrir o cambiar de libreta: el autoguardado actualiza currentNotebook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isCreatingNew, currentNotebook?.id]);

  // Focus trap, Escape key, Initial focus & Scroll lock
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current =
      document.activeElement as HTMLElement | null;
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
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

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
      const prevEl = previousActiveElementRef.current;
      if (prevEl && document.body.contains(prevEl)) {
        window.requestAnimationFrame(() => {
          prevEl.focus();
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      className="hubly-overlay"
      data-state={presence.state}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        className="hubly-sheet"
        data-state={presence.state}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          width: "100%",
          maxWidth: 780,
          maxHeight: "90vh",
          background: "#FAF5EC",
          borderRadius: 20,
          border: "1px solid #D6C2A5",
          boxShadow: "0 24px 60px rgba(44, 26, 11, 0.28)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          color: "#2C1A0B",
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
            width: 14,
            background: activeColorSpec.spine,
            zIndex: 2,
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: "16px 22px 14px 32px",
            background: "#F4E9D8",
            borderBottom: "1px solid #DFCBB0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: activeColorSpec.bg,
                color: "#FFFFFF",
                display: "grid",
                placeItems: "center",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)",
              }}
            >
              <BookOpen size={17} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: 9999,
                    background: "#E8D5B7",
                    color: "#3A2210",
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
                      fontWeight: 700,
                      color: "#15803D",
                      background: "#DCFCE7",
                      padding: "2px 8px",
                      borderRadius: 9999,
                    }}
                  >
                    <Check size={11} /> Guardado en Mi espacio
                  </span>
                )}
              </div>
              <h2
                id={titleId}
                style={{
                  margin: "3px 0 0",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#2C1A0B",
                }}
              >
                {isCreatingNew
                  ? "Nueva libreta Kraft"
                  : currentNotebook?.title || "Lector de Libretas Kraft"}
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <HublyCatAvatar size={26} />
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar lector de libreta"
              style={{
                width: 32,
                height: 32,
                borderRadius: 9999,
                border: "1px solid #D6C2A5",
                background: "#FAF5EC",
                color: "#5C3D22",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content Grid: Sidebar List + Kraft Reader/Editor */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "210px minmax(0, 1fr)",
            flex: 1,
            minHeight: 0,
            paddingLeft: 14,
          }}
        >
          {/* Left Notebook Switcher */}
          <div
            style={{
              background: "#F4E9D8",
              borderRight: "1px solid #DFCBB0",
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
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#6B4C30",
                }}
              >
                Mis libretas ({notebooks.length})
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                style={{
                  padding: "3px 8px",
                  borderRadius: 7,
                  border: "1px solid #C59B6D",
                  background: isCreatingNew ? "#3A2210" : "#FAF5EC",
                  color: isCreatingNew ? "#FFFFFF" : "#3A2210",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Plus size={11} /> Nueva
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
                    padding: "9px 10px",
                    borderRadius: 10,
                    border: selected
                      ? "1px solid #8C6239"
                      : "1px solid transparent",
                    background: selected ? "#FAF5EC" : "transparent",
                    color: "#2C1A0B",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      color: "#8C6239",
                      textTransform: "uppercase",
                    }}
                  >
                    {nb.category || nb.stamp || "LIBRETA"}
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: selected ? 800 : 600,
                      lineHeight: 1.25,
                    }}
                  >
                    {nb.title}
                  </span>
                  <span style={{ fontSize: 10.5, color: "#785A3C" }}>
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
              padding: "18px 22px",
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
                  padding: "9px 12px",
                  borderRadius: 10,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#B91C1C",
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
                gridTemplateColumns: "1.4fr 1fr",
                gap: 10,
              }}
            >
              <div>
                <label
                  htmlFor="nb-title-input"
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#5C3D22",
                    marginBottom: 4,
                  }}
                >
                  Título de la libreta *
                </label>
                <input
                  ref={titleInputRef}
                  id="nb-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Ej. Guía de onboarding y tono de marca"
                  style={{
                    width: "100%",
                    height: 36,
                    padding: "0 11px",
                    borderRadius: 9,
                    border: "1px solid #D6C2A5",
                    background: "var(--ui-surface)",
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: "#2C1A0B",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="nb-brand-select"
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#5C3D22",
                    marginBottom: 4,
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
                    borderRadius: 9,
                    border: "1px solid #D6C2A5",
                    background: "var(--ui-surface)",
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#2C1A0B",
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
                gridTemplateColumns: "1fr 140px",
                gap: 10,
              }}
            >
              <div>
                <label
                  htmlFor="nb-subtitle-input"
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#5C3D22",
                    marginBottom: 4,
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
                    height: 34,
                    padding: "0 10px",
                    borderRadius: 9,
                    border: "1px solid #D6C2A5",
                    background: "var(--ui-surface)",
                    fontSize: 12.5,
                    color: "#2C1A0B",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="nb-badge-input"
                  style={{
                    display: "block",
                    fontSize: 10.5,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#5C3D22",
                    marginBottom: 4,
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
                    height: 34,
                    padding: "0 10px",
                    borderRadius: 9,
                    border: "1px solid #D6C2A5",
                    background: "var(--ui-surface)",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#2C1A0B",
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
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#5C3D22",
                }}
              >
                Cubierta del cuaderno:
              </span>
              <div style={{ display: "flex", gap: 6 }}>
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
                        borderRadius: 9999,
                        border: active
                          ? "1.5px solid #2C1A0B"
                          : "1px solid #D6C2A5",
                        background: active ? c.bg : "var(--ui-surface)",
                        color: active ? "#FFFFFF" : "#3A2210",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lined Kraft Content Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 10.5,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#5C3D22",
                  marginBottom: 4,
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
            padding: "12px 22px 12px 32px",
            background: "#F4E9D8",
            borderTop: "1px solid #DFCBB0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/tareas?seccion=libretas"
              onClick={handleClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 700,
                color: "#5C3D22",
                textDecoration: "none",
              }}
            >
              <span>Abrir en Mi espacio</span>
              <ExternalLink size={12} />
            </Link>

            <button
              type="button"
              onClick={sendPendingToTasks}
              style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid #C59B6D", background: "#FAF5EC", color: "#3A2210", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
            >
              Enviar pendientes a Tareas
            </button>
            {taskNotice && <span role="status" style={{ fontSize: 11.5, fontWeight: 600, color: "#3A2210" }}>{taskNotice}</span>}

            {!isCreatingNew && currentNotebook && notebooks.length > 1 && (
              <button
                type="button"
                onClick={handleDeleteCurrent}
                style={{
                  padding: "5px 10px",
                  borderRadius: 8,
                  border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  color: "#B91C1C",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Trash2 size={12} />
                <span>Eliminar</span>
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                height: 35,
                padding: "0 14px",
                borderRadius: 9,
                border: "1px solid #C59B6D",
                background: "#FAF5EC",
                color: "#3A2210",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>

            <button
              type="submit"
              form="notebook-reader-form"
              style={{
                height: 35,
                padding: "0 16px",
                borderRadius: 9,
                border: "none",
                background: "#3A2210",
                color: "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Save size={13} />
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
