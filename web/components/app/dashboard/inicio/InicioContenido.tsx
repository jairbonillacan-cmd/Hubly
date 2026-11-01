"use client";

import { InicioWidget } from "./InicioWidget";
import { Button } from "@/components/app/ui/Button";
import { Modal } from "@/components/app/ui/Modal";
import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { NotebookEditor } from "@/components/app/NotebookEditor";
import { PendientesModal } from "@/components/app/dashboard/PendientesModal";
import { HublyCatAvatar, HublySunWeatherIcon, } from "@/components/app/icons/HublyIcons";
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
  const { agency, agencyName, editWidgetsMode, setWidgetConfigModalOpen, setEditWidgetsMode, toggleTaskStatus, toggleWidgetVisibility, moveWidget, isCreatingNotebook, setIsCreatingNotebook, nbTitle, setNbTitle, nbCategory, setNbCategory, setNbContent, pendientesOpen, setPendientesOpen, dragId, setDragId, setDragOrder, resizing, hiddenWidget, setHiddenWidget, layoutCopied, gridRef, greetingInfo, tasksBreakdown, activeNotebook, sortedWidgets, orderedVisibleWidgets, handleDragEnterWidget, handleDragEndWidget, handleHideWidget, handleResetLayout, handleCopyLayout, handleCycleSpan, handleResizeStart, handleOpenNewPost, handleOpenNewBrand, handleOpenInviteTeam, handleOpenSearch, handleSaveNotebook } = view;

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

      {/* ====================================================================
          MODAL LOCAL: CREAR NUEVA LIBRETA KRAFT (con gato de Hubly)
          (Los modales de Invitar equipo, Configurar widgets y Lector de libreta
          están montados globalmente en app/(app)/layout.tsx)
          ==================================================================== */}
      <Modal
        open={isCreatingNotebook}
        onClose={() => setIsCreatingNotebook(false)}
        label="Nueva libreta Kraft"
        className="hubly-sheet"
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
                Crear nota en Mi espacio
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
              background: "var(--ui-surface)",
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
                  background: "var(--ui-surface)",
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
                  background: "var(--ui-surface)",
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
                background: "var(--ui-surface)",
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
      </Modal>
    </>
  );
}
