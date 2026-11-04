"use client";

import React, { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useHublyStore } from "@/lib/store";
import { selectGreetingAndDate, selectTasksBreakdown } from "@/lib/domain-selectors";
import { Button } from "@/components/app/ui/Button";
import { PendientesModal } from "@/components/app/dashboard/PendientesModal";
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
import { InicioWidget } from "./InicioWidget";
import { useInicioView } from "./useInicioView";

type GreetingInfo = ReturnType<typeof selectGreetingAndDate>;

function InicioHero({
  greetingInfo,
  pendingCount,
  onOpenPendientes,
}: {
  greetingInfo: GreetingInfo;
  pendingCount: number;
  onOpenPendientes: () => void;
}) {
  const agency = useHublyStore((s) => s.agency);
  const agencyName = useHublyStore((s) => s.agencyName);
  const openComposer = useHublyStore((s) => s.openComposer);
  const setNewBrandModalOpen = useHublyStore((s) => s.setNewBrandModalOpen);
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
  const setCmdkOpen = useHublyStore((s) => s.setCmdkOpen);
  const setWidgetConfigModalOpen = useHublyStore((s) => s.setWidgetConfigModalOpen);
  const setActiveNotebookId = useHublyStore((s) => s.setActiveNotebookId);

  const closeOverlays = () => {
    setInviteModalOpen(false);
    setWidgetConfigModalOpen(false);
    setActiveNotebookId(null);
  };

  return (
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
        {pendingCount === 0 ? (
          "Todo al día por hoy."
        ) : (
          <>
            Tienes{" "}
            <button
              type="button"
              className="hubly-pending-pill"
              aria-haspopup="dialog"
              onClick={onOpenPendientes}
            >
              {pendingCount} {pendingCount === 1 ? "pendiente" : "pendientes"}
            </button>
            .
          </>
        )}
      </p>
      <div className="hubly-hero-actions">
        <Button onClick={() => { closeOverlays(); openComposer(null); }} variant="secondary">
          <HublyHashIcon size={18} />
          <span>Nuevo post</span>
        </Button>
        <Button onClick={() => { closeOverlays(); setNewBrandModalOpen(true); }} variant="secondary">
          <HublyTagIcon size={18} />
          <span>Nueva marca</span>
        </Button>
        <Button onClick={() => setInviteModalOpen(true)} variant="secondary">
          <HublyPeopleIcon size={18} />
          <span>Invitar equipo</span>
        </Button>
        <Button onClick={() => { closeOverlays(); setCmdkOpen(true); }} variant="gold" title="Buscar (Ctrl+K)">
          <HublySearchIcon size={18} />
          <span>Buscar</span>
        </Button>
      </div>
    </header>
  );
}

export function InicioContenido({ greetingInfo }: { greetingInfo: GreetingInfo }) {
  const tasks = useHublyStore((s) => s.tasks);
  const activeBrandId = useHublyStore((s) => s.activeBrandId);
  const fixedIsoNow = useHublyStore((s) => s.testClock?.fixedIsoNow);
  const timezone = useHublyStore((s) => s.profile?.timezone);
  const editWidgetsMode = useHublyStore((s) => s.editWidgetsMode);
  const setEditWidgetsMode = useHublyStore((s) => s.setEditWidgetsMode);
  const setWidgetConfigModalOpen = useHublyStore((s) => s.setWidgetConfigModalOpen);
  const toggleTaskStatus = useHublyStore((s) => s.toggleTaskStatus);
  const moveWidget = useHublyStore((s) => s.moveWidget);

  const {
    filterByBrand,
    setFilterByBrand,
    pendientesOpen,
    setPendientesOpen,
    dragId,
    resizing,
    hiddenWidget,
    layoutCopied,
    gridRef,
    orderedVisibleWidgets,
    handleDragStartWidget,
    handleDragEnterWidget,
    handleDragEndWidget,
    handleHideWidget,
    handleUndoHideWidget,
    handleResetLayout,
    handleCopyLayout,
    handleCycleSpan,
    handleResizeStart,
  } = useInicioView();

  const tasksBreakdown = useMemo(
    () => selectTasksBreakdown(tasks, activeBrandId, filterByBrand, fixedIsoNow, timezone),
    [tasks, activeBrandId, filterByBrand, fixedIsoNow, timezone]
  );

  return (
    <>
      <InicioHero
        greetingInfo={greetingInfo}
        pendingCount={tasksBreakdown.pendingCount}
        onOpenPendientes={() => setPendientesOpen(true)}
      />

      <div className="hubly-tablero-tools">
        {editWidgetsMode && (
          <>
            <Button onClick={handleResetLayout} variant="ghost" size="sm">
              <RotateCcw size={13} />
              <span>Restablecer</span>
            </Button>
            <Button onClick={handleCopyLayout} variant="secondary" size="sm">
              {layoutCopied ? "¡Copiado!" : "Copiar mi acomodo"}
            </Button>
          </>
        )}
        <Button onClick={() => setWidgetConfigModalOpen(true)} variant="gold" size="sm">
          + Widget
        </Button>
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
                  handleDragStartWidget(w.id);
                }}
                onDragOver={(e: React.DragEvent) => e.preventDefault()}
                onDragEnter={() => handleDragEnterWidget(w.id)}
                onDragEnd={handleDragEndWidget}
              >
                <div className="hubly-tablero-slot-inner">
                  <InicioWidget
                    widgetId={w.id}
                    filterByBrand={filterByBrand}
                    onToggleFilterByBrand={() => setFilterByBrand((prev) => !prev)}
                  />
                  {editWidgetsMode && (
                    <>
                      <div className="hubly-edit-controls">
                        <button type="button" className="hubly-edit-btn is-width" onClick={() => handleCycleSpan(w.id, span)} aria-label={`Cambiar ancho de ${w.title}, ahora ${span} ${span === 1 ? "columna" : "columnas"}`} title="Cambiar ancho">
                          {span}×
                        </button>
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
          <button type="button" onClick={handleUndoHideWidget}>
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
    </>
  );
}
