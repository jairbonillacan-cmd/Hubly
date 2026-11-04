"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { useActiveBrand } from "@/lib/use-active-brand";
import { useModalPresence } from "@/lib/use-modal-presence";
import { notebookPlainText, notebookTasks } from "@/lib/notebook-content";
import { dueLabelFor, localIsoDate } from "@/lib/date";

export interface NotebookReaderModalProps {
  open?: boolean;
  notebookId?: string | null;
  onClose?: () => void;
}

export const NOTEBOOK_COLORS = [
  { id: "kraft", label: "Kraft clásico", bg: "#C59B6D", spine: "#3A2210" },
  { id: "terracotta", label: "Terracota", bg: "#C87A51", spine: "#4A2511" },
  { id: "sage", label: "Salvia", bg: "#4A7862", spine: "#1E382B" },
  { id: "slate", label: "Pizarra", bg: "#475569", spine: "#1E293B" },
];

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

export function useNotebookReaderModal({
  open: openProp,
  notebookId: notebookIdProp,
  onClose: onCloseProp,
}: NotebookReaderModalProps = {}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const autosaveRef = useRef<number | undefined>(undefined);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

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

  const notebooks = useHublyStore((s) => s.notebooks);
  const activeNotebookId = useHublyStore((s) => s.activeNotebookId);
  const setActiveNotebookId = useHublyStore((s) => s.setActiveNotebookId);
  const addNotebook = useHublyStore((s) => s.addNotebook);
  const updateNotebook = useHublyStore((s) => s.updateNotebook);
  const deleteNotebook = useHublyStore((s) => s.deleteNotebook);
  const brands = useHublyStore((s) => s.brands);
  const activeBrand = useActiveBrand();

  const isOpen =
    openProp !== undefined
      ? openProp
      : explicitStoreOpen && Boolean(activeNotebookId);

  const targetNotebookId =
    notebookIdProp !== undefined ? notebookIdProp : activeNotebookId;

  const currentNotebook =
    notebooks.find((n) => n.id === targetNotebookId) || notebooks[0] || null;

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("GUÍA DE AGENCIA");
  const [brandId, setBrandId] = useState(activeBrand?.id ?? "");
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

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null); // eslint-disable-line react-hooks/set-state-in-effect -- reinicia el formulario al abrir
    setSavedNotice(false);

    if (isCreatingNew || !currentNotebook) {
      setTitle("");
      setSubtitle("Notas operativas y acuerdos de cuenta");
      setCategory("ESTRATEGIA");
      setBrandId(activeBrand?.id ?? "");
      setAccentColor("#C59B6D");
      setContent("");
    } else {
      setTitle(currentNotebook.title);
      setSubtitle(currentNotebook.subtitle || "Guía operativa de agencia");
      setCategory(
        currentNotebook.category || currentNotebook.stamp || "LIBRETA KRAFT"
      );
      setBrandId(currentNotebook.brandId || activeBrand?.id || "");
      setAccentColor(currentNotebook.accentColor || "#C59B6D");
      setContent(currentNotebook.content);
    }
    // Solo al abrir o cambiar de libreta: el autoguardado actualiza currentNotebook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isCreatingNew, currentNotebook?.id]);

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

    return () => {
      window.cancelAnimationFrame(rafId);
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
  }, [isOpen]);

  const presence = useModalPresence(isOpen);

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
    for (const taskTitle of fresh) {
      state.addTask({
        brandId,
        title: taskTitle,
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

  const handleContentChange = (html: string) => {
    setContent(html);
    if (errorMsg) setErrorMsg(null);
    if (!isCreatingNew && currentNotebook) {
      const id = currentNotebook.id;
      window.clearTimeout(autosaveRef.current);
      autosaveRef.current = window.setTimeout(() => updateNotebook(id, { content: html }), 500);
    }
  };

  return {
    titleId,
    dialogRef,
    titleInputRef,
    notebooks,
    brands,
    isOpen,
    presence,
    currentNotebook,
    isCreatingNew,
    setIsCreatingNew,
    setActiveNotebookId,
    title,
    setTitle,
    subtitle,
    setSubtitle,
    category,
    setCategory,
    brandId,
    setBrandId,
    accentColor,
    setAccentColor,
    savedNotice,
    taskNotice,
    errorMsg,
    setErrorMsg,
    activeColorSpec,
    handleClose,
    handleSave,
    sendPendingToTasks,
    handleDeleteCurrent,
    handleContentChange,
  };
}
