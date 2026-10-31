"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Hash,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useHublyStore } from "@/lib/store";
import { NotebookEditor } from "@/components/app/NotebookEditor";
import {
  selectGreetingAndDate,
  selectTasksBreakdown,
  selectTodayPostsAndApprovals,
} from "@/lib/domain-selectors";
import type {
  DashboardWidgetId,
  DashboardWidgetSpan,
  TaskDueBucket,
  TaskPriority,
} from "@/lib/types";
import { KraftNotebookCard } from "@/components/app/KraftNotebookCard";
import { PendientesModal } from "@/components/app/dashboard/PendientesModal";
import { useModalPresence } from "@/lib/use-modal-presence";
import {
  HublyCatAvatar,
  HublySunWeatherIcon,
  HublyClipboardIcon,
  HublyNotebookIcon,
  HublyCalendarIcon,
  HublyBellIcon,
  BarChart2,
  Megaphone,
} from "@/components/app/icons/HublyIcons";

/* ==========================================================================
   ICONOS E ILUSTRACIONES DE ESTADOS VACÍOS Y WIDGETS DE INICIO
   ========================================================================== */

function QuickBuildingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="2"
        width="11"
        height="12"
        rx="2"
        stroke="#64748B"
        strokeWidth="1.4"
      />
      <path
        d="M5.5 5.5H7M9 5.5H10.5M5.5 8.5H7M9 8.5H10.5M6.5 14V11.2H9.5V14"
        stroke="#64748B"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function QuickUsersGroupIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6" cy="5.5" r="2.2" stroke="#64748B" strokeWidth="1.4" />
      <path
        d="M2.2 13C2.2 10.9 3.9 9.5 6 9.5C8.1 9.5 9.8 10.9 9.8 13"
        stroke="#64748B"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="11.2" cy="6" r="1.7" stroke="#64748B" strokeWidth="1.3" />
      <path
        d="M10.5 12.8C10.8 11.3 12 10.3 13.6 10.5"
        stroke="#64748B"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function WidgetCheckCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" fill="#FFF1F2" stroke="#F43F5E" strokeWidth="1.4" />
      <path
        d="M5.5 8.2L7.2 9.9L10.7 6.3"
        stroke="#E11D48"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MoonWeatherIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M25.5 19.6A10.6 10.6 0 0 1 12.4 6.5a10.6 10.6 0 1 0 13.1 13.1Z"
        fill="#9099D3"
        stroke="#5A65AF"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function notebookStamp(index: number, updatedAt: string) {
  const date = new Date(updatedAt);
  const number = `N° ${String(index + 1).padStart(2, "0")}`;
  if (Number.isNaN(date.getTime())) return number;
  const month = date.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase();
  return `${number} · ${month} ${String(date.getFullYear()).slice(-2)}`;
}

function EmptyCalendarIllustration() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect
        x="4"
        y="6"
        width="20"
        height="18"
        rx="4"
        fill="#FFFFFF"
        stroke="#5A65AF"
        strokeWidth="1.6"
      />
      <path d="M4 11H24" stroke="#5A65AF" strokeWidth="1.5" />
      <path
        d="M9 4V7.5M19 4V7.5"
        stroke="#5A65AF"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="10" cy="15.5" r="1.2" fill="#6C77C1" />
      <circle cx="14" cy="15.5" r="1.2" fill="#6C77C1" />
      <circle cx="18" cy="15.5" r="1.2" fill="#6C77C1" />
    </svg>
  );
}

function EmptyBellIllustration() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M14 5C10.1 5 7 8.1 7 12V16.5L5.2 19.2C4.8 19.8 5.2 20.6 6 20.6H22C22.8 20.6 23.2 19.8 22.8 19.2L21 16.5V12C21 8.1 17.9 5 14 5Z"
        fill="#F5F6FB"
        stroke="#5A65AF"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M11.5 21C11.9 22.4 12.8 23.2 14 23.2C15.2 23.2 16.1 22.4 16.5 21"
        stroke="#5A65AF"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmptyShieldCheckIllustration() {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M14 4.5L21.5 7.5V13.8C21.5 18.6 18.3 22.3 14 23.8C9.7 22.3 6.5 18.6 6.5 13.8V7.5L14 4.5Z"
        fill="#F5F6FB"
        stroke="#5A65AF"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10.8 14.2L13 16.4L17.5 11.8"
        stroke="#059669"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ==========================================================================
/* ==========================================================================
   VISTA PRINCIPAL DE INICIO (/dashboard)
   ========================================================================== */

export function InicioView() {
  const store = useHublyStore();
  const {
    profile,
    agency,
    agencyName,
    testClock,
    activeBrandId,
    brands,
    tasks,
    posts,
    notebooks,
    notifications,
    ads,
    widgets,
    editWidgetsMode,
    composerOpen,
    newBrandModalOpen,
    inviteModalOpen,
    cmdkOpen,
    widgetConfigModalOpen,
    activeNotebookId,
    openComposer,
    closeComposer,
    setNewBrandModalOpen,
    setInviteModalOpen,
    setCmdkOpen,
    setWidgetConfigModalOpen,
    setEditWidgetsMode,
    setActiveNotebookId,
    toggleTaskStatus,
    addTask,
    deleteTask,
    toggleWidgetVisibility,
    moveWidget,
    resetWidgetsLayout,
    reorderWidgets,
    setWidgetSpan,
    projects,
    markNotificationRead,
    markAllNotificationsRead,
    updatePostStatus,
    updateNotebook,
    addNotebook,
    inviteTeamMember,
  } = store;

  // Filtro de tareas: por defecto true (marca activa = "Mi marca" -> 2 pendientes en seed)
  const [filterByBrand, setFilterByBrand] = useState<boolean>(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false);
  const [showQuickTaskForm, setShowQuickTaskForm] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskBucket, setNewTaskBucket] = useState<TaskDueBucket>("today");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Media");

  // Estado local del modal Invitar equipo
  const [inviteName, setInviteName] = useState<string>("");
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [inviteRole, setInviteRole] = useState<string>("Creador de Contenido");
  const [inviteFeedback, setInviteFeedback] = useState<string | null>(null);

  // Estado local del modal Lector/Editor de Libretas Kraft
  const [isCreatingNotebook, setIsCreatingNotebook] = useState<boolean>(false);
  const [nbTitle, setNbTitle] = useState<string>("");
  const [nbSubtitle, setNbSubtitle] = useState<string>("");
  const [nbCategory, setNbCategory] = useState<string>("Guía");
  const [nbContent, setNbContent] = useState<string>("");
  const [nbSaveToast, setNbSaveToast] = useState<boolean>(false);

  const [pendientesOpen, setPendientesOpen] = useState<boolean>(false);
  const [dragId, setDragId] = useState<DashboardWidgetId | null>(null);
  const [dragOrder, setDragOrder] = useState<DashboardWidgetId[] | null>(null);
  const [resizing, setResizing] = useState<{ id: DashboardWidgetId; span: DashboardWidgetSpan } | null>(null);
  const [hiddenWidget, setHiddenWidget] = useState<{ id: DashboardWidgetId; title: string } | null>(null);
  const [layoutCopied, setLayoutCopied] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const notebookPresence = useModalPresence(isCreatingNotebook);

  const activeBrand = useMemo(
    () => brands.find((b) => b.id === activeBrandId) || brands[0],
    [brands, activeBrandId]
  );

  // Selectores de dominio conectados al reloj determinista / timezone
  const greetingInfo = useMemo(
    () => selectGreetingAndDate(profile, testClock?.fixedIsoNow),
    [profile, testClock?.fixedIsoNow]
  );

  const tasksBreakdown = useMemo(
    () =>
      selectTasksBreakdown(
        tasks,
        activeBrandId,
        filterByBrand,
        testClock?.fixedIsoNow,
        profile?.timezone
      ),
    [tasks, activeBrandId, filterByBrand, testClock?.fixedIsoNow, profile?.timezone]
  );

  const allBrandsTasksBreakdown = useMemo(
    () =>
      selectTasksBreakdown(
        tasks,
        activeBrandId,
        false,
        testClock?.fixedIsoNow,
        profile?.timezone
      ),
    [tasks, activeBrandId, testClock?.fixedIsoNow, profile?.timezone]
  );

  const todayAndApprovals = useMemo(
    () =>
      selectTodayPostsAndApprovals(
        posts,
        activeBrandId,
        testClock?.fixedIsoNow,
        filterByBrand,
        profile?.timezone
      ),
    [posts, activeBrandId, testClock?.fixedIsoNow, filterByBrand, profile?.timezone]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read),
    [notifications]
  );

  const activeNotebook = useMemo(
    () => notebooks.find((nb) => nb.id === activeNotebookId) || null,
    [notebooks, activeNotebookId]
  );

  useEffect(() => {
    if (activeNotebook) {
      setIsCreatingNotebook(false);
      setNbTitle(activeNotebook.title);
      setNbSubtitle(activeNotebook.subtitle || "");
      setNbCategory(activeNotebook.category || "Guía");
      setNbContent(activeNotebook.content);
    }
  }, [activeNotebook]);

  // Listener global de Escape para cerrar cualquier modal abierto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (composerOpen) closeComposer();
        if (newBrandModalOpen) setNewBrandModalOpen(false);
        if (inviteModalOpen) setInviteModalOpen(false);
        if (cmdkOpen) setCmdkOpen(false);
        if (widgetConfigModalOpen) setWidgetConfigModalOpen(false);
        if (activeNotebookId) setActiveNotebookId(null);
        if (isCreatingNotebook) setIsCreatingNotebook(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    composerOpen,
    newBrandModalOpen,
    inviteModalOpen,
    cmdkOpen,
    widgetConfigModalOpen,
    activeNotebookId,
    isCreatingNotebook,
    closeComposer,
    setNewBrandModalOpen,
    setInviteModalOpen,
    setCmdkOpen,
    setWidgetConfigModalOpen,
    setActiveNotebookId,
  ]);

  // Orden y columnas de widgets persistidos en store
  const sortedWidgets = useMemo(
    () => [...widgets].sort((a, b) => a.order - b.order),
    [widgets]
  );

  const orderedVisibleWidgets = useMemo(() => {
    const ordered = dragOrder
      ? dragOrder.flatMap((id) => sortedWidgets.filter((w) => w.id === id))
      : sortedWidgets;
    return ordered.filter((w) => w.visible);
  }, [dragOrder, sortedWidgets]);

  const criticalProjects = useMemo(() => {
    const statusWeight = { Revisión: 0, "En curso": 1, Completado: 2 } as const;
    return projects
      .filter((p) => p.status !== "Completado")
      .sort(
        (a, b) =>
          statusWeight[a.status] - statusWeight[b.status] ||
          a.dueDate.localeCompare(b.dueDate) ||
          a.progress - b.progress
      )
      .slice(0, 5);
  }, [projects]);

  useEffect(() => {
    if (!hiddenWidget) return;
    const timer = window.setTimeout(() => setHiddenWidget(null), 4000);
    return () => window.clearTimeout(timer);
  }, [hiddenWidget]);

  useEffect(() => () => setEditWidgetsMode(false), [setEditWidgetsMode]);

  const handleDragEnterWidget = (targetId: DashboardWidgetId) => {
    if (!dragId || dragId === targetId) return;
    setDragOrder((prev) => {
      if (!prev) return prev;
      const next = prev.filter((id) => id !== dragId);
      next.splice(next.indexOf(targetId), 0, dragId);
      return next;
    });
  };

  const handleDragEndWidget = () => {
    if (dragOrder) reorderWidgets(dragOrder);
    setDragOrder(null);
    setDragId(null);
  };

  const handleHideWidget = (id: DashboardWidgetId, title: string) => {
    toggleWidgetVisibility(id);
    setHiddenWidget({ id, title });
  };

  const handleResetLayout = () => {
    resetWidgetsLayout();
    setHiddenWidget(null);
  };

  const handleCopyLayout = async () => {
    const layout = sortedWidgets.map(({ id, order, span, visible }) => ({ id, order, span: span ?? 1, visible }));
    try {
      await navigator.clipboard.writeText(JSON.stringify(layout));
      setLayoutCopied(true);
      window.setTimeout(() => setLayoutCopied(false), 1600);
    } catch {
      setLayoutCopied(false);
    }
  };

  const handleResizeStart = (
    event: React.PointerEvent,
    id: DashboardWidgetId,
    startSpan: DashboardWidgetSpan
  ) => {
    const grid = gridRef.current;
    if (!grid) return;
    event.preventDefault();
    event.stopPropagation();
    const styles = getComputedStyle(grid);
    const maxCols = styles.gridTemplateColumns.split(" ").length;
    if (maxCols <= 1) return;
    const gap = parseFloat(styles.columnGap) || 24;
    const colWidth = (grid.clientWidth - gap * (maxCols - 1)) / maxCols;
    const startX = event.clientX;
    let current = startSpan;
    setResizing({ id, span: startSpan });
    const onMove = (e: PointerEvent) => {
      const width = startSpan * colWidth + (startSpan - 1) * gap + (e.clientX - startX);
      current = Math.min(maxCols, Math.max(1, Math.round((width + gap) / (colWidth + gap)))) as DashboardWidgetSpan;
      setResizing({ id, span: current });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setWidgetSpan(id, current);
      setResizing(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // Handlers de las 4 acciones rápidas superiores
  const handleOpenNewPost = () => {
    setInviteModalOpen(false);
    setWidgetConfigModalOpen(false);
    setActiveNotebookId(null);
    openComposer(null);
  };

  const handleOpenNewBrand = () => {
    setInviteModalOpen(false);
    setWidgetConfigModalOpen(false);
    setActiveNotebookId(null);
    setNewBrandModalOpen(true);
  };

  const handleOpenInviteTeam = () => {
    setInviteFeedback(null);
    setInviteModalOpen(true);
  };

  const handleOpenSearch = () => {
    setInviteModalOpen(false);
    setWidgetConfigModalOpen(false);
    setActiveNotebookId(null);
    setCmdkOpen(true);
  };

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTaskTitle.trim();
    if (!clean) return;
    const dueDateIso =
      newTaskBucket === "today"
        ? tasksBreakdown.todayIso
        : newTaskBucket === "tomorrow"
          ? tasksBreakdown.tomorrowIso
          : tasksBreakdown.todayIso;
    const dueLabelMap: Record<TaskDueBucket, string> = {
      overdue: "Atrasada",
      today: "Hoy",
      tomorrow: "Mañana",
      upcoming: "Próximas",
    };
    addTask({
      brandId: activeBrandId || "brand-min",
      title: clean,
      dueLabel: dueLabelMap[newTaskBucket],
      dueDate: dueDateIso,
      dueBucket: newTaskBucket,
      priority: newTaskPriority,
      assignee: profile?.name || "Jair",
      listName: "General",
      status: "pendiente",
    });
    setNewTaskTitle("");
    setShowQuickTaskForm(false);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inviteEmail.trim();
    if (!cleanEmail) return;
    const derivedName =
      inviteName.trim() ||
      cleanEmail
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    inviteTeamMember({
      name: derivedName,
      email: cleanEmail,
      role: inviteRole,
    });
    setInviteFeedback(`Invitación enviada a ${cleanEmail}`);
    setInviteName("");
    setInviteEmail("");
    setTimeout(() => {
      setInviteModalOpen(false);
      setInviteFeedback(null);
    }, 900);
  };

  const handleSaveNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingNotebook) {
      if (!nbTitle.trim()) return;
      addNotebook({
        brandId: activeBrandId,
        title: nbTitle.trim().toUpperCase(),
        subtitle: nbSubtitle.trim() || "Nota operativa del equipo",
        category: nbCategory,
        content: nbContent.trim() || "Escribe aquí los acuerdos y aprendizajes de la cuenta.",
        accentColor: "#0A7A55",
        isPinned: false,
      });
      setIsCreatingNotebook(false);
      return;
    }
    if (!activeNotebook) return;
    updateNotebook(activeNotebook.id, {
      title: nbTitle.trim() || activeNotebook.title,
      subtitle: nbSubtitle.trim(),
      category: nbCategory,
      content: nbContent,
    });
    setNbSaveToast(true);
    setTimeout(() => setNbSaveToast(false), 1600);
  };

  /* ========================================================================
     RENDERIZADOR DE CADA WIDGET DEL BENTO GRID
     ======================================================================== */

  const renderWidget = (widgetId: DashboardWidgetId) => {

    switch (widgetId) {
      case "tareas": {
        const visibleGroups = tasksBreakdown.groups.filter((g) => g.tasks.length > 0);
        return (
          <section
            key="tareas"
            id="dashboard-tareas-widget"
            data-widget-id="tareas"
            className="henry-widget"
          >
            <div className="henry-widget-head" style={{ flexWrap: "wrap", gap: 8 }}>
              <div className="henry-widget-title">
                <span className="henry-widget-icon-box">
                  <HublyClipboardIcon size={18} />
                </span>
                <span>Tareas</span>
                <span className="henry-widget-badge">{tasksBreakdown.pendingCount}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setFilterByBrand((prev) => !prev)}
                  title="Alternar entre tareas de la marca activa y todas las marcas"
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 999,
                    border: "1px solid rgba(226, 232, 240, 0.95)",
                    background: filterByBrand ? "#F8FAFC" : "#F5F6FB",
                    color: filterByBrand ? "#64748B" : "#5360A5",
                    cursor: "pointer",
                  }}
                >
                  {filterByBrand
                    ? `${activeBrand?.name || "Mi marca"} (${tasksBreakdown.pendingCount})`
                    : `Todas (${allBrandsTasksBreakdown.pendingCount})`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickTaskForm((prev) => !prev)}
                  title="Añadir tarea rápida"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 999,
                    border: "1px solid rgba(226, 232, 240, 0.95)",
                    background: "#FFFFFF",
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  <Plus className="w-3 h-3" />
                  <span>Nueva</span>
                </button>
              </div>
            </div>

            {showQuickTaskForm && (
              <form
                onSubmit={handleCreateQuickTask}
                style={{
                  padding: "12px 20px",
                  background: "#F8FAFC",
                  borderBottom: "1px solid #F1F5F9",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Escribe una tarea pendiente para el equipo..."
                  aria-label="Título de nueva tarea"
                  style={{
                    width: "100%",
                    padding: "7px 11px",
                    fontSize: 12.5,
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    background: "#FFFFFF",
                    color: "#0F172A",
                    outline: "none",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <select
                      value={newTaskBucket}
                      onChange={(e) => setNewTaskBucket(e.target.value as TaskDueBucket)}
                      aria-label="Cuándo vence"
                      style={{
                        fontSize: 11.5,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #CBD5E1",
                        background: "#FFFFFF",
                        color: "#334155",
                      }}
                    >
                      <option value="today">Para hoy</option>
                      <option value="tomorrow">Para mañana</option>
                      <option value="upcoming">Próximas</option>
                      <option value="overdue">Atrasada</option>
                    </select>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                      aria-label="Prioridad"
                      style={{
                        fontSize: 11.5,
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #CBD5E1",
                        background: "#FFFFFF",
                        color: "#334155",
                      }}
                    >
                      <option value="Alta">Prioridad Alta</option>
                      <option value="Media">Prioridad Media</option>
                      <option value="Baja">Prioridad Baja</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => setShowQuickTaskForm(false)}
                      style={{
                        fontSize: 11.5,
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "1px solid #E2E8F0",
                        background: "#FFFFFF",
                        color: "#64748B",
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "4px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: "#0F172A",
                        color: "#FFFFFF",
                        cursor: "pointer",
                      }}
                    >
                      Guardar tarea
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="henry-widget-body henry-widget-body--tall" style={{ padding: "16px 20px" }}>
              {visibleGroups.length === 0 ? (
                <div className="henry-widget-empty" style={{ flex: 1 }}>
                  <div className="henry-empty-illus">
                    <EmptyShieldCheckIllustration />
                  </div>
                  <div className="henry-empty-title">
                    Todo al día en {filterByBrand ? activeBrand?.name || "esta marca" : "tu agencia"}
                  </div>
                  <p className="henry-empty-desc">No tienes tareas pendientes en este filtro.</p>
                </div>
              ) : (
                visibleGroups.map((group, groupIdx) => (
                  <div
                    key={group.bucket}
                    style={{ marginBottom: groupIdx < visibleGroups.length - 1 ? 14 : 0 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: group.bucket === "overdue" ? "#EF4444" : "#94A3B8",
                        marginBottom: 8,
                      }}
                    >
                      <span>{group.label}</span>
                      {group.tasks.length > 1 && <span>{group.tasks.length}</span>}
                    </div>

                    <div className="hubly-task-group" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {group.tasks.map((task) => {
                        const taskBrand = brands.find((b) => b.id === task.brandId);
                        const isDone =
                          Boolean(task.completed) ||
                          task.status === "completada" ||
                          task.status === "done";
                        return (
                          <div
                            key={task.id}
                            className="hubly-task-row"
                            onClick={() => toggleTaskStatus(task.id)}
                            role="checkbox"
                            aria-checked={isDone}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleTaskStatus(task.id);
                              }
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                              <span className="hubly-check" data-done={isDone}>
                                {isDone && <Check className="w-2.5 h-2.5 text-white" />}
                              </span>
                              <span className="hubly-task-title">{task.title}</span>
                            </div>

                            {!filterByBrand && taskBrand && (
                              <span
                                style={{
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  padding: "2px 7px",
                                  borderRadius: 999,
                                  background: "#F1F5F9",
                                  color: "#475569",
                                  flexShrink: 0,
                                }}
                              >
                                {taskBrand.name}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}

              {tasksBreakdown.completedCount > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 10,
                    borderTop: "1px dashed #E2E8F0",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowCompletedTasks((prev) => !prev)}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: "#64748B",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>
                      {showCompletedTasks ? "Ocultar" : "Ver"} completadas (
                      {tasksBreakdown.completedCount})
                    </span>
                  </button>

                  {showCompletedTasks && (
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {tasksBreakdown.completedTasks.map((task) => (
                        <div
                          key={task.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "4px 6px",
                            borderRadius: 6,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(task.id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              textAlign: "left",
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                background: "#10B981",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Check className="w-2.5 h-2.5 text-white" />
                            </span>
                            <span
                              style={{
                                fontSize: 12.5,
                                color: "#94A3B8",
                                textDecoration: "line-through",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {task.title}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            title="Eliminar tarea"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#CBD5E1",
                              cursor: "pointer",
                              padding: 2,
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="henry-widget-footer">
                <Link href="/tareas" className="henry-widget-link">
                  Mi Espacio →
                </Link>
              </div>
            </div>
          </section>
        );
      }

      case "libretas": {
        return (
          <section
            key="libretas"
            data-widget-id="libretas"
            className="henry-widget"
          >
            <div className="henry-widget-head">
              <div className="henry-widget-title">
                <span className="henry-widget-icon-box">
                  <HublyNotebookIcon size={18} />
                </span>
                <span>Libretas</span>
                <span className="henry-widget-badge">{notebooks.length}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveNotebookId(null);
                    setIsCreatingNotebook(true);
                    setNbTitle("");
                    setNbSubtitle("");
                    setNbCategory("Idea");
                    setNbContent("");
                  }}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "3px 9px",
                    borderRadius: 999,
                    border: "1px solid rgba(226, 232, 240, 0.95)",
                    background: "#FFFFFF",
                    color: "#475569",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Plus className="w-3 h-3" />
                  <span>Nota</span>
                </button>
              </div>
            </div>

            <div className="henry-widget-body henry-widget-body--tall" style={{ padding: "18px 20px" }}>
              <div className="hubly-shelf">
                {notebooks.map((nb) => (
                  <KraftNotebookCard
                    key={nb.id}
                    title={nb.title}
                    stamp={nb.stamp || notebookStamp(notebooks.indexOf(nb), nb.updatedAt)}
                    variant={nb.variant}
                    subtitle={nb.subtitle}
                    category={nb.category}
                    isPinned={nb.isPinned}
                    accentColor={nb.accentColor}
                    onClick={() => {
                      setIsCreatingNotebook(false);
                      setActiveNotebookId(nb.id);
                    }}
                  />
                ))}
              </div>
              <div className="henry-widget-footer">
                <Link href="/libretas" className="henry-widget-link">
                  Ver libretas →
                </Link>
              </div>
            </div>
          </section>
        );
      }

      case "hoy": {
        return (
          <section
            key="hoy"
            data-widget-id="hoy"
            className="henry-widget"
          >
            <div className="henry-widget-head">
              <div className="henry-widget-title">
                <span className="henry-widget-icon-box">
                  <HublyCalendarIcon size={18} />
                </span>
                <span>Hoy</span>
                {todayAndApprovals.todayCount > 0 && (
                  <span className="henry-widget-badge">{todayAndApprovals.todayCount}</span>
                )}
              </div>
              <Link href="/calendario" className="henry-widget-link">
                Calendario →
              </Link>
            </div>

            {todayAndApprovals.isEmptyToday ? (
              <div className="henry-widget-body henry-widget-empty">
                <div className="henry-empty-illus">
                  <EmptyCalendarIllustration />
                </div>
                <div className="henry-empty-title">Sin eventos para hoy</div>
                <p className="henry-empty-desc">Hoy no sale nada programado.</p>
              </div>
            ) : (
              <div className="henry-widget-body" style={{ padding: "14px 20px 18px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {todayAndApprovals.todayPosts.map((post) => {
                    const postBrand = brands.find((b) => b.id === post.brandId);
                    return (
                      <div
                        key={post.id}
                        onClick={() => openComposer(post.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid #F1F5F9",
                          background: "#F8FAFC",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#0F172A",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {post.title}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                            {post.scheduledTime} · {post.networks.join(", ")}
                            {postBrand ? ` · ${postBrand.name}` : ""}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 8px",
                            borderRadius: 999,
                            background: "#ECFDF5",
                            color: "#059669",
                            flexShrink: 0,
                          }}
                        >
                          {post.format}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        );
      }

      case "notificaciones": {
        return (
          <section
            key="notificaciones"
            data-widget-id="notificaciones"
            className="henry-widget"
          >
            <div className="henry-widget-head">
              <div className="henry-widget-title">
                <span className="henry-widget-icon-box">
                  <HublyBellIcon size={18} />
                </span>
                <span>Notificaciones</span>
                {unreadNotifications.length > 0 && (
                  <span className="henry-widget-badge">{unreadNotifications.length}</span>
                )}
              </div>
              {unreadNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: "#64748B",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Marcar leídas
                </button>
              )}
            </div>

            {unreadNotifications.length === 0 ? (
              <div className="henry-widget-body henry-widget-empty">
                <div className="henry-empty-illus">
                  <EmptyBellIllustration />
                </div>
                <div className="henry-empty-title">Sin notificaciones nuevas</div>
                <p className="henry-empty-desc">
                  Sin notificaciones — cuando algo necesite tu atención, aparece aquí como en la
                  campana.
                </p>
              </div>
            ) : (
              <div className="henry-widget-body" style={{ padding: "14px 20px 18px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {unreadNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: "#F5F6FB",
                        border: "1px solid #ECEEF8",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: "#0F172A" }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                          {notif.body}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => markNotificationRead(notif.id)}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#5A65AF",
                          background: "#FFFFFF",
                          border: "1px solid #D9DCF0",
                          borderRadius: 999,
                          padding: "2px 8px",
                          cursor: "pointer",
                          flexShrink: 0,
                        }}
                      >
                        Listo
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      }

      case "aprobaciones": {
        return (
          <section
            key="aprobaciones"
            className="henry-widget"
          >
            <div className="henry-widget-head">
              <div className="henry-widget-title">
                <span className="henry-widget-icon-box">
                  <WidgetCheckCircleIcon />
                </span>
                <span>Aprobaciones</span>
                {todayAndApprovals.approvalsCount > 0 && (
                  <span className="henry-widget-badge">{todayAndApprovals.approvalsCount}</span>
                )}
              </div>
              <Link href="/aprobaciones" className="henry-widget-link">
                Ver todas →
              </Link>
            </div>

            {todayAndApprovals.isEmptyApprovals ? (
              <div className="henry-widget-body henry-widget-empty">
                <div className="henry-empty-illus">
                  <EmptyShieldCheckIllustration />
                </div>
                <div className="henry-empty-title">Sin aprobaciones pendientes</div>
                <p className="henry-empty-desc">Nada esperando aprobación ✓</p>
              </div>
            ) : (
              <div className="henry-widget-body" style={{ padding: "14px 20px 18px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {todayAndApprovals.approvalPosts.map((post) => {
                    const postBrand = brands.find((b) => b.id === post.brandId);
                    return (
                      <div
                        key={post.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid #F1F5F9",
                          background: "#F8FAFC",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#0F172A",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {post.title}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                            {postBrand?.name || "Marca"} · {post.scheduledDate} ({post.scheduledTime})
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() =>
                              updatePostStatus(
                                post.id,
                                "approved",
                                "Aprobado desde Inicio.",
                                profile?.name || "Jair",
                                "agency"
                              )
                            }
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              padding: "4px 9px",
                              borderRadius: 999,
                              border: "none",
                              background: "#10B981",
                              color: "#FFFFFF",
                              cursor: "pointer",
                            }}
                          >
                            Aprobar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        );
      }

      case "grafica_ads": {
        const totalSpend = ads.reduce((acc, a) => acc + (a.spend || 0), 0);
        const avgCtr =
          ads.length > 0
            ? (ads.reduce((acc, a) => acc + a.ctr, 0) / ads.length).toFixed(2)
            : "0.00";
        return (
          <section
            key="grafica_ads"
            className="henry-widget"
          >
            <div className="henry-widget-head">
              <div className="henry-widget-title">
                <span className="henry-widget-icon-box">
                  <BarChart2 size={18} />
                </span>
                <span>Gráfica de Ads</span>
              </div>
              <Link href="/salud" className="henry-widget-link">
                Salud y Ads →
              </Link>
            </div>
            <div className="henry-widget-body" style={{ padding: "16px 20px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
                    INVERSIÓN ACUMULADA
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>
                    {totalSpend.toLocaleString("es-MX")} MXN
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>
                    CTR PROMEDIO
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#059669", marginTop: 4 }}>
                    {avgCtr}%
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      }

      case "ads_activos": {
        const activeCampaigns = ads.filter((a) => a.status === "Activo");
        return (
          <section
            key="ads_activos"
            className="henry-widget"
          >
            <div className="henry-widget-head">
              <div className="henry-widget-title">
                <span className="henry-widget-icon-box">
                  <Megaphone size={18} />
                </span>
                <span>Ads Activos</span>
                <span className="henry-widget-badge">{activeCampaigns.length}</span>
              </div>
              <Link href="/salud" className="henry-widget-link">
                Ver campañas →
              </Link>
            </div>
            <div className="henry-widget-body" style={{ padding: "14px 20px 18px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeCampaigns.map((camp) => (
                  <div
                    key={camp.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "9px 12px",
                      borderRadius: 10,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "#0F172A",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {camp.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>
                        {camp.platform} · {camp.results} {camp.resultLabel}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "#ECFDF5",
                        color: "#059669",
                      }}
                    >
                      Click {camp.clickScore}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "proyectos_criticos": {
        return (
          <section key="proyectos_criticos" data-widget-id="proyectos_criticos" className="henry-widget">
            <div className="henry-widget-head">
              <div className="henry-widget-title">
                <span className="henry-widget-icon-box">
                  <HublyClipboardIcon size={18} />
                </span>
                <span>Proyectos críticos</span>
                {criticalProjects.length > 0 && (
                  <span className="henry-widget-badge">{criticalProjects.length}</span>
                )}
              </div>
              <Link href="/proyectos" className="henry-widget-link">
                Ver proyectos →
              </Link>
            </div>
            {criticalProjects.length === 0 ? (
              <div className="henry-widget-body henry-widget-empty">
                <div className="henry-empty-illus">
                  <EmptyShieldCheckIllustration />
                </div>
                <div className="henry-empty-title">Sin proyectos en riesgo</div>
                <p className="henry-empty-desc">Todos tus proyectos abiertos van en orden.</p>
              </div>
            ) : (
              <div className="henry-widget-body" style={{ padding: "12px 14px" }}>
                {criticalProjects.map((project) => (
                  <Link key={project.id} href="/proyectos" className="hubly-task-row" style={{ textDecoration: "none" }}>
                    <span style={{ minWidth: 0 }}>
                      <span className="hubly-task-title" style={{ display: "block", fontWeight: 600 }}>
                        {project.title}
                      </span>
                      <span style={{ fontSize: 11.5, color: "#8A8AAA" }}>
                        {brands.find((b) => b.id === project.brandId)?.name || "Marca"} · {project.status}
                      </span>
                    </span>
                    <span className="henry-widget-badge">{project.progress}%</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        );
      }

      default:
        return null;
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <header className="hubly-hero">
        <p className="hubly-hero-eyebrow">{agency?.name || agencyName || "Tu agencia"}</p>
        <h1 data-testid="dashboard-greeting-title" className="hubly-hero-title">
          <span>
            {greetingInfo.greetingPrefix}, {greetingInfo.userName}
          </span>
          <span className="hubly-weather" key={greetingInfo.period}>
            {greetingInfo.period === "night" ? <MoonWeatherIcon /> : <HublySunWeatherIcon size={32} />}
          </span>
        </h1>
        <p data-testid="dashboard-greeting-subtitle" className="hubly-hero-date">
          {greetingInfo.dateTitleCase}
        </p>
        <p className="hubly-hero-pending">
          {tasksBreakdown.pendingCount === 0 ? (
            "Todo al día por hoy."
          ) : (
            <>
              Tienes{" "}
              <button
                type="button"
                className="hubly-pending-pill"
                aria-haspopup="dialog"
                onClick={() => setPendientesOpen(true)}
              >
                {tasksBreakdown.pendingCount}{" "}
                {tasksBreakdown.pendingCount === 1 ? "pendiente" : "pendientes"}
              </button>
              .
            </>
          )}
        </p>
        <div className="hubly-hero-actions">
          <button type="button" onClick={handleOpenNewPost} className="hbtn hbtn-secondary">
            <Hash />
            <span>Nuevo post</span>
          </button>
          <button type="button" onClick={handleOpenNewBrand} className="hbtn hbtn-secondary">
            <QuickBuildingIcon />
            <span>Nueva marca</span>
          </button>
          <button type="button" onClick={handleOpenInviteTeam} className="hbtn hbtn-secondary">
            <QuickUsersGroupIcon />
            <span>Invitar equipo</span>
          </button>
          <button type="button" onClick={handleOpenSearch} className="hbtn hbtn-gold" title="Buscar (Ctrl+K)">
            <Search />
            <span>Buscar</span>
          </button>
        </div>
      </header>

      <div className="hubly-tablero-tools">
        {editWidgetsMode && (
          <>
            <button type="button" onClick={handleResetLayout} className="hbtn hbtn-ghost hbtn-sm">
              <RotateCcw size={13} />
              <span>Restablecer</span>
            </button>
            <button type="button" onClick={handleCopyLayout} className="hbtn hbtn-secondary hbtn-sm">
              {layoutCopied ? "¡Copiado!" : "Copiar mi acomodo"}
            </button>
          </>
        )}
        <button type="button" onClick={() => setWidgetConfigModalOpen(true)} className="hbtn hbtn-gold hbtn-sm">
          + Widget
        </button>
        <button
          type="button"
          onClick={() => setEditWidgetsMode(!editWidgetsMode)}
          aria-pressed={editWidgetsMode}
          className={`hbtn hbtn-sm ${editWidgetsMode ? "hbtn-primary" : "hbtn-secondary"}`}
        >
          {editWidgetsMode ? "Listo" : "Editar"}
        </button>
      </div>

      <div ref={gridRef} className="hubly-tablero-grid">
        <AnimatePresence initial={false} mode="popLayout">
          {orderedVisibleWidgets.map((w) => {
            const span = resizing?.id === w.id ? resizing.span : w.span ?? 1;
            return (
              <motion.div
                key={w.id}
                layout={editWidgetsMode}
                transition={{ layout: { type: "spring", stiffness: 420, damping: 38 } }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
                className={`hubly-tablero-slot is-span-${span} ${editWidgetsMode ? "is-editing" : ""} ${dragId === w.id ? "is-dragging" : ""}`}
                draggable={editWidgetsMode && resizing === null}
                onDragStartCapture={(e: React.DragEvent) => {
                  e.dataTransfer.effectAllowed = "move";
                  setDragId(w.id);
                  setDragOrder(sortedWidgets.map((x) => x.id));
                }}
                onDragOver={(e: React.DragEvent) => e.preventDefault()}
                onDragEnter={() => handleDragEnterWidget(w.id)}
                onDragEnd={handleDragEndWidget}
              >
                <div className="hubly-tablero-slot-inner">
                  {renderWidget(w.id)}
                  {editWidgetsMode && (
                    <>
                      <div className="hubly-edit-controls">
                        <button type="button" className="hubly-edit-btn" onClick={() => moveWidget(w.id, "up")} aria-label={`Mover ${w.title} antes`} title="Mover antes">
                          <ArrowLeft size={13} />
                        </button>
                        <button type="button" className="hubly-edit-btn" onClick={() => moveWidget(w.id, "down")} aria-label={`Mover ${w.title} después`} title="Mover después">
                          <ArrowRight size={13} />
                        </button>
                        <button type="button" className="hubly-edit-btn is-remove" onClick={() => handleHideWidget(w.id, w.title)} aria-label={`Quitar ${w.title}`} title={`Quitar ${w.title}`}>
                          <X size={13} />
                        </button>
                      </div>
                      <div
                        className={`hubly-resize-handle ${resizing?.id === w.id ? "is-active" : ""}`}
                        aria-hidden="true"
                        onPointerDown={(e) => handleResizeStart(e, w.id, span)}
                        onDragStart={(e) => e.preventDefault()}
                      >
                        <span />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {hiddenWidget && (
        <div className="hubly-undo-toast" role="status">
          <span>{hiddenWidget.title} se quitó del tablero</span>
          <button
            type="button"
            onClick={() => {
              toggleWidgetVisibility(hiddenWidget.id);
              setHiddenWidget(null);
            }}
          >
            Deshacer
          </button>
        </div>
      )}

      <PendientesModal
        open={pendientesOpen}
        onClose={() => setPendientesOpen(false)}
        groups={tasksBreakdown.groups}
        onToggle={toggleTaskStatus}
      />

      {/* ====================================================================
          MODAL LOCAL: CREAR NUEVA LIBRETA KRAFT (con gato de Hubly)
          (Los modales de Invitar equipo, Configurar widgets y Lector de libreta
          están montados globalmente en app/(app)/layout.tsx)
          ==================================================================== */}
      {notebookPresence.mounted && (
        <div
          className="hubly-overlay"
          data-state={notebookPresence.state}
          onClick={() => {
            setIsCreatingNotebook(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 85,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(15, 23, 42, 0.38)",
          }}
        >
          <div
            role="dialog"
            className="hubly-sheet"
            data-state={notebookPresence.state}
            aria-modal="true"
            aria-label="Nueva libreta Kraft"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 540,
              borderRadius: 22,
              background: "#FDF8EE",
              border: "2px solid #8B572A",
              boxShadow: "0 24px 48px rgba(44, 26, 11, 0.28)",
              padding: "22px 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                paddingBottom: 14,
                borderBottom: "1px dashed #D6BC94",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <HublyCatAvatar size={42} />
                <div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#8B572A",
                    }}
                  >
                    NUEVA LIBRETA KRAFT
                  </span>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#2C1A0B", margin: 0 }}>
                    Crear nota en Mi Espacio
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNotebook(false);
                }}
                aria-label="Cerrar libreta"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: "1px solid #D6BC94",
                  background: "#FFFFFF",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#5C3A1B",
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveNotebook}
              style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 140px",
                  gap: 10,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#5C3A1B",
                      marginBottom: 4,
                    }}
                  >
                    Título de la libreta
                  </label>
                  <input
                    type="text"
                    required
                    value={nbTitle}
                    onChange={(e) => setNbTitle(e.target.value)}
                    placeholder="Ej. IDEAS DE CONTENIDO Q4"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 10,
                      border: "1px solid #C8A97E",
                      background: "#FFFFFF",
                      color: "#2C1A0B",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#5C3A1B",
                      marginBottom: 4,
                    }}
                  >
                    Categoría
                  </label>
                  <select
                    value={nbCategory}
                    onChange={(e) => setNbCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      fontSize: 13,
                      borderRadius: 10,
                      border: "1px solid #C8A97E",
                      background: "#FFFFFF",
                      color: "#2C1A0B",
                    }}
                  >
                    <option value="Guía">Guía</option>
                    <option value="Idea">Idea</option>
                    <option value="Brief">Brief</option>
                    <option value="Minuta">Minuta</option>
                    <option value="Checklist">Checklist</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "#5C3A1B",
                    marginBottom: 4,
                  }}
                >
                  Contenido y notas
                </label>
                <NotebookEditor
                  key={activeNotebook?.id || "nueva"}
                  initialContent={activeNotebook?.content || ""}
                  onChange={setNbContent}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNotebook(false);
                  }}
                  style={{
                    padding: "8px 14px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    borderRadius: 10,
                    border: "1px solid #C8A97E",
                    background: "#FFFFFF",
                    color: "#5C3A1B",
                    cursor: "pointer",
                  }}
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 16px",
                    fontSize: 12.5,
                    fontWeight: 700,
                    borderRadius: 10,
                    border: "none",
                    background: "#8B572A",
                    color: "#FFFFFF",
                    cursor: "pointer",
                  }}
                >
                  Crear libreta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MotionConfig>
  );
}

export default InicioView;
