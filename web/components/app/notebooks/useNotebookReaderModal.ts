"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { useActiveBrand } from "@/lib/use-active-brand";
import {
  NOTEBOOK_COLORS,
  buildNotebookFormDraft,
  extractFreshNotebookTasks,
  resolveNextNotebookIdAfterDelete,
  validateAndBuildNotebookInput,
} from "@/lib/domain/notebooks";
import { dueLabelFor, localIsoDate } from "@/lib/date";

export interface NotebookReaderModalProps {
  open?: boolean;
  notebookId?: string | null;
  onClose?: () => void;
}

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

export function useNotebookReaderModal({
  open: openProp,
  notebookId: notebookIdProp,
  onClose: onCloseProp,
}: NotebookReaderModalProps = {}) {
  const titleId = useId();
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const autosaveRef = useRef<number | undefined>(undefined);

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
  const [accentColor, setAccentColor] = useState<string>(NOTEBOOK_COLORS[0].bg);
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

    const draft = buildNotebookFormDraft(
      currentNotebook,
      isCreatingNew,
      activeBrand?.id ?? ""
    );
    setTitle(draft.title);
    setSubtitle(draft.subtitle);
    setCategory(draft.category);
    setBrandId(draft.brandId);
    setAccentColor(draft.accentColor);
    setContent(draft.content);
    // Solo al abrir o cambiar de libreta: el autoguardado actualiza currentNotebook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isCreatingNew, currentNotebook?.id]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    window.clearTimeout(autosaveRef.current);

    const validation = validateAndBuildNotebookInput({
      title,
      subtitle,
      category,
      brandId,
      accentColor,
      content,
    });

    if (!validation.ok) {
      setErrorMsg(validation.error);
      if (validation.field === "title") {
        titleInputRef.current?.focus();
      }
      return;
    }

    if (isCreatingNew || !currentNotebook) {
      const created = addNotebook(validation.payload);
      setIsCreatingNew(false);
      setActiveNotebookId(created.id);
    } else {
      updateNotebook(currentNotebook.id, validation.payload);
    }

    setSavedNotice(true);
    setErrorMsg(null);
    window.setTimeout(() => setSavedNotice(false), 2400);
  };

  const sendPendingToTasks = () => {
    const state = useHublyStore.getState();
    const fresh = extractFreshNotebookTasks(content, state.tasks, brandId);
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
    setTaskNotice(
      fresh.length === 0
        ? "No hay pendientes nuevos."
        : `${fresh.length} enviados a Tareas.`
    );
    window.setTimeout(() => setTaskNotice(null), 2400);
  };

  const handleDeleteCurrent = () => {
    if (!currentNotebook || isCreatingNew) return;
    deleteNotebook(currentNotebook.id);
    const nextId = resolveNextNotebookIdAfterDelete(notebooks, currentNotebook.id);
    if (!nextId) {
      handleClose();
    } else {
      setActiveNotebookId(nextId);
    }
  };

  const handleContentChange = (html: string) => {
    setContent(html);
    if (errorMsg) setErrorMsg(null);
    if (!isCreatingNew && currentNotebook) {
      const id = currentNotebook.id;
      window.clearTimeout(autosaveRef.current);
      autosaveRef.current = window.setTimeout(
        () => updateNotebook(id, { content: html }),
        500
      );
    }
  };

  return {
    titleId,
    titleInputRef,
    notebooks,
    brands,
    isOpen,
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
    handleClose,
    handleSave,
    sendPendingToTasks,
    handleDeleteCurrent,
    handleContentChange,
  };
}
