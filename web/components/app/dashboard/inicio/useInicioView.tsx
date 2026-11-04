"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import { useActiveBrand } from "@/lib/use-active-brand";
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
import { selectCriticalProjects } from "@/components/app/dashboard/ExtraWidgets";

/** Estado y datos de InicioView. */
export function useInicioView() {
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
  } = store;
  // Filtro de tareas: por defecto true (marca activa = "Mi marca" -> 2 pendientes en seed)
  const [filterByBrand, setFilterByBrand] = useState<boolean>(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(false);
  const [showQuickTaskForm, setShowQuickTaskForm] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskBucket, setNewTaskBucket] = useState<TaskDueBucket>("today");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("Media");
  // Estado local del modal Invitar equipo

  const [pendientesOpen, setPendientesOpen] = useState<boolean>(false);
  const [dragId, setDragId] = useState<DashboardWidgetId | null>(null);
  const [dragOrder, setDragOrder] = useState<DashboardWidgetId[] | null>(null);
  const [resizing, setResizing] = useState<{ id: DashboardWidgetId; span: DashboardWidgetSpan } | null>(null);
  const [hiddenWidget, setHiddenWidget] = useState<{ id: DashboardWidgetId; title: string } | null>(null);
  const [layoutCopied, setLayoutCopied] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const activeBrand = useActiveBrand();
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
  const criticalProjects = useMemo(() => selectCriticalProjects(projects), [projects]);
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
  const handleCycleSpan = (id: DashboardWidgetId, span: DashboardWidgetSpan) => {
    const grid = gridRef.current;
    if (!grid) return;
    const maxCols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
    setWidgetSpan(id, (span >= maxCols ? 1 : span + 1) as DashboardWidgetSpan);
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
      brandId: activeBrand?.id ?? "",
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
  /* ========================================================================
     RENDERIZADOR DE CADA WIDGET DEL BENTO GRID
     ======================================================================== */


  return { store, profile, agency, agencyName, testClock, activeBrandId, brands, tasks, posts, notebooks, notifications, ads, widgets, editWidgetsMode, composerOpen, newBrandModalOpen, inviteModalOpen, cmdkOpen, widgetConfigModalOpen, activeNotebookId, openComposer, closeComposer, setNewBrandModalOpen, setInviteModalOpen, setCmdkOpen, setWidgetConfigModalOpen, setEditWidgetsMode, setActiveNotebookId, toggleTaskStatus, addTask, deleteTask, toggleWidgetVisibility, moveWidget, resetWidgetsLayout, reorderWidgets, setWidgetSpan, projects, markNotificationRead, markAllNotificationsRead, updatePostStatus, updateNotebook, addNotebook, filterByBrand, setFilterByBrand, showCompletedTasks, setShowCompletedTasks, showQuickTaskForm, setShowQuickTaskForm, newTaskTitle, setNewTaskTitle, newTaskBucket, setNewTaskBucket, newTaskPriority, setNewTaskPriority, pendientesOpen, setPendientesOpen, dragId, setDragId, dragOrder, setDragOrder, resizing, setResizing, hiddenWidget, setHiddenWidget, layoutCopied, setLayoutCopied, gridRef, activeBrand, greetingInfo, tasksBreakdown, allBrandsTasksBreakdown, todayAndApprovals, unreadNotifications, sortedWidgets, orderedVisibleWidgets, criticalProjects, handleDragEnterWidget, handleDragEndWidget, handleHideWidget, handleResetLayout, handleCopyLayout, handleCycleSpan, handleResizeStart, handleOpenNewPost, handleOpenNewBrand, handleOpenInviteTeam, handleOpenSearch, handleCreateQuickTask };
}

export type InicioViewModel = ReturnType<typeof useInicioView>;
