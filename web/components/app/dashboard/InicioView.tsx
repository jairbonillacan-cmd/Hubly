"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useHublyStore } from "@/lib/store";
import {
  selectGreetingAndDate,
  selectTasksBreakdown,
  selectTodayPostsAndApprovals,
} from "@/lib/domain-selectors";
import type {
  DashboardWidgetId,
  DashboardWidgetSpan,
} from "@/lib/types";
import { PendientesModal } from "@/components/app/dashboard/PendientesModal";
import { TareasWidget } from "@/components/app/dashboard/widgets/TareasWidget";
import { LibretasWidget } from "@/components/app/dashboard/widgets/LibretasWidget";
import { HoyWidget } from "@/components/app/dashboard/widgets/HoyWidget";
import { NotificacionesWidget } from "@/components/app/dashboard/widgets/NotificacionesWidget";
import { AprobacionesWidget } from "@/components/app/dashboard/widgets/AprobacionesWidget";
import { GraficaAdsWidget } from "@/components/app/dashboard/widgets/GraficaAdsWidget";
import { AdsActivosWidget } from "@/components/app/dashboard/widgets/AdsActivosWidget";
import { ProyectosCriticosWidget } from "@/components/app/dashboard/widgets/ProyectosCriticosWidget";
import { HublySunWeatherIcon } from "@/components/app/icons/HublyIcons";
import {
  HublyArrowLeftIcon as ArrowLeft,
  HublyArrowRightIcon as ArrowRight,
  HublyCloseIcon as X,
  HublyHashIcon,
  HublyMoonIcon,
  HublyPeopleIcon,
  HublyRefreshIcon as RotateCcw,
  HublySearchIcon,
  HublyTagIcon,
} from "@/components/app/icons/DuotoneIcons";

/* ==========================================================================
   ICONOS E ILUSTRACIONES DE ESTADOS VACÍOS Y WIDGETS DE INICIO
   ========================================================================== */

/* ==========================================================================
/* ==========================================================================
   VISTA PRINCIPAL DE INICIO (/dashboard)
   ========================================================================== */

export function InicioView() {
  const profile = useHublyStore((s) => s.profile);
  const agency = useHublyStore((s) => s.agency);
  const agencyName = useHublyStore((s) => s.agencyName);
  const testClock = useHublyStore((s) => s.testClock);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const tasks = useHublyStore((s) => s.tasks);
  const posts = useHublyStore((s) => s.posts);
  const widgets = useHublyStore((s) => s.widgets);
  const editWidgetsMode = useHublyStore((s) => s.editWidgetsMode);
  const openComposer = useHublyStore((s) => s.openComposer);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
  const setCmdkOpen = useHublyStore((s) => s.setCmdkOpen);
  const setWidgetConfigModalOpen = useHublyStore((s) => s.setWidgetConfigModalOpen);
  const setEditWidgetsMode = useHublyStore((s) => s.setEditWidgetsMode);
  const setActiveNotebookId = useHublyStore((s) => s.setActiveNotebookId);
  const toggleTaskStatus = useHublyStore((s) => s.toggleTaskStatus);
  const toggleWidgetVisibility = useHublyStore((s) => s.toggleWidgetVisibility);
  const moveWidget = useHublyStore((s) => s.moveWidget);
  const resetWidgetsLayout = useHublyStore((s) => s.resetWidgetsLayout);
  const reorderWidgets = useHublyStore((s) => s.reorderWidgets);
  const setWidgetSpan = useHublyStore((s) => s.setWidgetSpan);

  // Filtro de tareas: por defecto true (marca activa = "Mi marca" -> 2 pendientes en seed)
  const [filterByBrand, setFilterByBrand] = useState<boolean>(true);

  const [pendientesOpen, setPendientesOpen] = useState<boolean>(false);
  const [dragId, setDragId] = useState<DashboardWidgetId | null>(null);
  const [dragOrder, setDragOrder] = useState<DashboardWidgetId[] | null>(null);
  const [resizing, setResizing] = useState<{ id: DashboardWidgetId; span: DashboardWidgetSpan } | null>(null);
  const [hiddenWidget, setHiddenWidget] = useState<{ id: DashboardWidgetId; title: string } | null>(null);
  const [layoutCopied, setLayoutCopied] = useState<boolean>(false);
  const gridRef = useRef<HTMLDivElement | null>(null);


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
    setInviteModalOpen(true);
  };

  const handleOpenSearch = () => {
    setInviteModalOpen(false);
    setWidgetConfigModalOpen(false);
    setActiveNotebookId(null);
    setCmdkOpen(true);
  };


  /* ========================================================================
     RENDERIZADOR DE CADA WIDGET DEL BENTO GRID
     ======================================================================== */

  const renderWidget = (widgetId: DashboardWidgetId) => {

    switch (widgetId) {
      case "tareas":
        return <TareasWidget filterByBrand={filterByBrand} setFilterByBrand={setFilterByBrand} tasksBreakdown={tasksBreakdown} />;

      case "libretas":
        return <LibretasWidget />;

      case "hoy":
        return <HoyWidget todayAndApprovals={todayAndApprovals} />;

      case "notificaciones":
        return <NotificacionesWidget />;

      case "aprobaciones":
        return <AprobacionesWidget todayAndApprovals={todayAndApprovals} />;

      case "grafica_ads":
        return <GraficaAdsWidget />;

      case "ads_activos":
        return <AdsActivosWidget />;

      case "proyectos_criticos":
        return <ProyectosCriticosWidget />;

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
            {greetingInfo.period === "night" ? <HublyMoonIcon size={32} /> : <HublySunWeatherIcon size={32} />}
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
            <HublyHashIcon size={18} />
            <span>Nuevo post</span>
          </button>
          <button type="button" onClick={handleOpenNewBrand} className="hbtn hbtn-secondary">
            <HublyTagIcon size={18} />
            <span>Nueva marca</span>
          </button>
          <button type="button" onClick={handleOpenInviteTeam} className="hbtn hbtn-secondary">
            <HublyPeopleIcon size={18} />
            <span>Invitar equipo</span>
          </button>
          <button type="button" onClick={handleOpenSearch} className="hbtn hbtn-gold" title="Buscar (Ctrl+K)">
            <HublySearchIcon size={18} />
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
              {layoutCopied ? "Copiado" : "Copiar mi acomodo"}
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
    </MotionConfig>
  );
}

export default InicioView;
