"use client";

import { InicioWidget } from "./InicioWidget";
import { Button } from "@/components/app/ui/Button";
import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { PendientesModal } from "@/components/app/dashboard/PendientesModal";
import { HublySunWeatherIcon, } from "@/components/app/icons/HublyIcons";
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
import type { InicioViewModel } from "./useInicioView";

export function InicioContenido({ view }: { view: InicioViewModel }) {
  const { agency, agencyName, editWidgetsMode, setWidgetConfigModalOpen, setEditWidgetsMode, toggleTaskStatus, toggleWidgetVisibility, moveWidget, pendientesOpen, setPendientesOpen, dragId, setDragId, setDragOrder, resizing, hiddenWidget, setHiddenWidget, layoutCopied, gridRef, greetingInfo, tasksBreakdown, sortedWidgets, orderedVisibleWidgets, handleDragEnterWidget, handleDragEndWidget, handleHideWidget, handleResetLayout, handleCopyLayout, handleCycleSpan, handleResizeStart, handleOpenNewPost, handleOpenNewBrand, handleOpenInviteTeam, handleOpenSearch } = view;

  return (
    <>
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
          <Button onClick={handleOpenNewPost} variant="secondary">
            <HublyHashIcon size={18} />
            <span>Nuevo post</span>
          </Button>
          <Button onClick={handleOpenNewBrand} variant="secondary">
            <HublyTagIcon size={18} />
            <span>Nueva marca</span>
          </Button>
          <Button onClick={handleOpenInviteTeam} variant="secondary">
            <HublyPeopleIcon size={18} />
            <span>Invitar equipo</span>
          </Button>
          <Button onClick={handleOpenSearch} variant="gold" title="Buscar (Ctrl+K)">
            <HublySearchIcon size={18} />
            <span>Buscar</span>
          </Button>
        </div>
      </header>

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
                  setDragId(w.id);
                  setDragOrder(sortedWidgets.map((x) => x.id));
                }}
                onDragOver={(e: React.DragEvent) => e.preventDefault()}
                onDragEnter={() => handleDragEnterWidget(w.id)}
                onDragEnd={handleDragEndWidget}
              >
                <div className="hubly-tablero-slot-inner">
                  <InicioWidget widgetId={w.id} view={view} />
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

    </>
  );
}
