"use client";

import { Modal } from "@/components/app/ui/Modal";
import React, { useEffect, useId, useRef, useState } from "react";
import { useHublyStore } from "@/lib/store";
import type { DashboardWidgetId } from "@/lib/types";
import { WidgetPreview } from "@/components/app/dashboard/WidgetPreview";
import { HublyCheckIcon as Check, HublyPlusIcon as Plus } from "@/components/app/icons/DuotoneIcons";

interface WidgetConfigModalProps {
  open: boolean;
  onClose: () => void;
}

const CATALOGO: Array<{
  grupo: string;
  items: Array<{ id: DashboardWidgetId; title: string; description: string }>;
}> = [
  {
    grupo: "Números",
    items: [
      { id: "metrica", title: "Métrica", description: "Un número grande que tú eliges: posts, gasto, resultados…" },
    ],
  },
  {
    grupo: "Tu trabajo",
    items: [
      { id: "tareas", title: "Tareas", description: "Lo vencido, lo de hoy y lo que viene" },
      { id: "libretas", title: "Libretas", description: "Tus libretas de Mi espacio" },
      { id: "notificaciones", title: "Notificaciones", description: "Lo que necesita tu atención" },
      { id: "proyectos_criticos", title: "Proyectos críticos", description: "Los abiertos, por revisión y fecha" },
    ],
  },
  {
    grupo: "Social media",
    items: [
      { id: "hoy", title: "Hoy", description: "Lo que sale hoy" },
      { id: "aprobaciones", title: "Aprobaciones", description: "Lo que espera a tu cliente" },
      { id: "posts", title: "Posts", description: "Lo próximo de la marca activa" },
      { id: "feed", title: "Feed", description: "Lo último publicado de la marca activa" },
      { id: "semana", title: "Semana", description: "Posts por día en todas tus marcas" },
    ],
  },
  {
    grupo: "Equipo",
    items: [
      { id: "mensajes", title: "Mensajes", description: "Tus chats con el equipo" },
      { id: "actividad", title: "Actividad", description: "Qué ha hecho el equipo" },
      { id: "equipo", title: "Equipo", description: "Quién lleva más puntos" },
    ],
  },
  {
    grupo: "Ads",
    items: [
      { id: "reportes", title: "Reportes", description: "Los últimos reportes de tus marcas" },
      { id: "grafica_ads", title: "Gráfica de Ads", description: "Inversión acumulada y CTR" },
      { id: "ads_activos", title: "Ads activos", description: "Campañas en circulación y sus resultados" },
    ],
  },
];

export function WidgetConfigModal({ open, onClose }: WidgetConfigModalProps) {
  const titleId = useId();
  const doneRef = useRef<HTMLButtonElement | null>(null);

  const widgets = useHublyStore((s) => s.widgets);
  const setWidgetVisibility = useHublyStore((s) => s.setWidgetVisibility);
  const reorderWidgets = useHublyStore((s) => s.reorderWidgets);

  const [notice, setNotice] = useState<string | null>(null);

  const handleClose = () => {
    setNotice(null);
    onClose();
  };

  useEffect(() => {
    if (open) doneRef.current?.focus();
  }, [open]);

  const visibleIds = new Set(widgets.filter((w) => w.visible).map((w) => w.id));

  const handleToggle = (id: DashboardWidgetId) => {
    if (visibleIds.has(id)) {
      if (visibleIds.size <= 1) {
        setNotice("Mantén al menos un widget visible en el Dashboard.");
        return;
      }
      setNotice(null);
      setWidgetVisibility(id, false);
      return;
    }
    setNotice(null);
    const sorted = [...widgets].sort((a, b) => a.order - b.order);
    const placed = sorted.filter((w) => w.visible).map((w) => w.id);
    const rest = sorted.filter((w) => !w.visible && w.id !== id).map((w) => w.id);
    reorderWidgets([...placed, id, ...rest]);
    setWidgetVisibility(id, true);
  };

  return (
    <Modal open={open} onClose={handleClose} labelledBy={titleId} className="hubly-sheet hubly-cal-modal hubly-wgal">
      <div className="hubly-wgal-head">
        <div>
          <h2 id={titleId}>Widgets</h2>
          <p>Toca uno para agregarlo a Inicio o quitarlo. Para acomodarlos o cambiar su ancho, usa Editar.</p>
        </div>
        <button ref={doneRef} type="button" className="hbtn hbtn-primary hbtn-sm" onClick={handleClose}>
          Listo
        </button>
      </div>

      {notice && <div className="hubly-wgal-aviso" role="status">{notice}</div>}

      <div className="hubly-wgal-scroll">
        {CATALOGO.map(({ grupo, items }) => (
          <section key={grupo}>
            <h3 className="hubly-wgal-rotulo">{grupo}</h3>
            <div className="hubly-wgal-grid">
              {items.map((item) => {
                const placed = visibleIds.has(item.id);
                return (
                  <div key={item.id} className={`hubly-wgal-card ${placed ? "is-placed" : ""}`}>
                    <div className="hubly-wgal-preview" aria-hidden="true" inert>
                      <div className="hubly-wgal-zoom">
                        <WidgetPreview id={item.id} />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="hubly-wgal-toggle"
                      aria-pressed={placed}
                      title={placed ? "Quitar de Inicio" : "Agregar a Inicio"}
                      onClick={() => handleToggle(item.id)}
                    >
                      <span className="hubly-wgal-nombre">{item.title}</span>
                      <span className="hubly-wgal-estado">
                        {placed ? <Check size={14} /> : <Plus size={14} />}
                        {placed ? "Agregado" : "Agregar"}
                      </span>
                      <span className="hubly-wgal-desc">{item.description}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  );
}

