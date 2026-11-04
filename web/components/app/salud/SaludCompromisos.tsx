"use client";

import React, { useState } from "react";
import { Button } from "@/components/app/ui/Button";
import { HublyCheckIcon } from "@/components/app/icons/DuotoneIcons";
import type { CommitmentDraft, DraftNumberKey } from "@/lib/domain-selectors";
import type { CustomCommitmentMetric } from "@/lib/types";

const METRIC_TEMPLATES: {
  label: string;
  items: { name: string; unit: "semana" | "mes" | "total" }[];
}[] = [
  {
    label: "Contenido",
    items: [
      { name: "Posts en feed", unit: "semana" },
      { name: "Reels publicados", unit: "semana" },
      { name: "Stories publicadas", unit: "semana" },
      { name: "Carruseles publicados", unit: "mes" },
      { name: "Sesiones de foto o video", unit: "mes" },
      { name: "Blogs publicados", unit: "mes" },
    ],
  },
  {
    label: "Comunidad",
    items: [
      { name: "Comentarios respondidos", unit: "semana" },
      { name: "Mensajes respondidos", unit: "semana" },
      { name: "Colaboraciones con creadores", unit: "mes" },
      { name: "Nuevos seguidores", unit: "mes" },
    ],
  },
  {
    label: "Pauta",
    items: [
      { name: "Campañas activas", unit: "mes" },
      { name: "Creativos nuevos", unit: "mes" },
      { name: "Leads generados", unit: "mes" },
      { name: "Ventas atribuidas", unit: "mes" },
    ],
  },
  {
    label: "Cliente",
    items: [
      { name: "Reportes entregados", unit: "mes" },
      { name: "Juntas de seguimiento", unit: "mes" },
      { name: "Parrillas aprobadas", unit: "mes" },
    ],
  },
];

const EDITOR_FIELDS: {
  id: string;
  label: string;
  done: DraftNumberKey;
  commit: DraftNumberKey;
}[] = [
  { id: "posts", label: "Publicaciones", done: "postsCompleted", commit: "postsCommitted" },
  { id: "stories", label: "Stories", done: "StoriesCompleted", commit: "StoriesCommitted" },
  { id: "reels", label: "Reels", done: "reelsCompleted", commit: "reelsCommitted" },
  { id: "ads", label: "Campañas Ads", done: "adCampaignsCompleted", commit: "adCampaignsCommitted" },
];

interface SaludCompromisosProps {
  brandId: string;
  brandName: string;
  periodLabel: string;
  draft: CommitmentDraft;
  onChangeDraft: React.Dispatch<React.SetStateAction<CommitmentDraft | null>>;
  onSave: (brandId: string, brandName: string) => void;
  onCancel: () => void;
}

export function SaludCompromisos({
  brandId,
  brandName,
  periodLabel,
  draft,
  onChangeDraft,
  onSave,
  onCancel,
}: SaludCompromisosProps) {
  const [newMetricName, setNewMetricName] = useState("");
  const [newMetricValue, setNewMetricValue] = useState("");
  const [newMetricUnit, setNewMetricUnit] = useState<"semana" | "mes" | "total">("semana");

  function setDraftNumber(key: DraftNumberKey, raw: string) {
    onChangeDraft((d) => (d ? { ...d, [key]: Math.max(0, Number(raw) || 0) } : d));
  }

  function handleAddDraftCustomMetric() {
    if (!newMetricName.trim()) return;
    const numericVal = Number(newMetricValue);
    const metric: CustomCommitmentMetric = {
      id: `cm-${Date.now()}`,
      name: newMetricName.trim(),
      value: Number.isFinite(numericVal) && numericVal >= 0 ? numericVal : 10,
      unit: newMetricUnit,
    };
    onChangeDraft({ ...draft, customMetrics: [...draft.customMetrics, metric] });
    setNewMetricName("");
    setNewMetricValue("");
  }

  function handleRemoveDraftCustomMetric(metricId: string) {
    onChangeDraft({
      ...draft,
      customMetrics: draft.customMetrics.filter((m) => m.id !== metricId),
    });
  }

  return (
    <div className="hubly-salud-editor" data-testid={`commitment-editor-panel-${brandId}`}>
      <div className="hubly-salud-section-head">
        <div>
          <h2>Compromisos de {brandName}</h2>
          <p>
            Periodo: {periodLabel}. Al cambiar las cifras se recalculan el cumplimiento y la salud.
          </p>
        </div>
      </div>

      <div className="hubly-salud-editor-grid">
        {EDITOR_FIELDS.map((f) => (
          <fieldset key={f.id} className="hubly-salud-fieldset">
            <legend>{f.label}</legend>
            <label>
              <span>Entregadas</span>
              <input
                type="number"
                min={0}
                className="hubly-cal-input"
                aria-label={`${f.label} entregadas ${brandName}`}
                data-testid={`input-${f.id}-completed-${brandId}`}
                value={draft[f.done] as number}
                onChange={(e) => setDraftNumber(f.done, e.target.value)}
              />
            </label>
            <label>
              <span>Comprometidas</span>
              <input
                type="number"
                min={0}
                className="hubly-cal-input"
                aria-label={`${f.label} comprometidas ${brandName}`}
                data-testid={`input-${f.id}-committed-${brandId}`}
                value={draft[f.commit] as number}
                onChange={(e) => setDraftNumber(f.commit, e.target.value)}
              />
            </label>
          </fieldset>
        ))}
      </div>

      <div className="hubly-salud-paid">
        <label className="hubly-salud-check">
          <input
            type="checkbox"
            checked={draft.hasPaidAds}
            onChange={(e) => onChangeDraft({ ...draft, hasPaidAds: e.target.checked })}
          />
          <span>Maneja pauta</span>
        </label>
        {draft.hasPaidAds && (
          <label className="hubly-salud-inline">
            <span>Presupuesto mensual ($)</span>
            <input
              type="number"
              min={0}
              className="hubly-cal-input"
              aria-label="Presupuesto mensual de pauta"
              value={draft.monthlySpend}
              onChange={(e) =>
                onChangeDraft({ ...draft, monthlySpend: Number(e.target.value) || 0 })
              }
            />
          </label>
        )}
      </div>

      <div className="hubly-salud-section">
        <h3 className="hubly-ajustes-label">Métricas personalizadas</h3>
        {draft.customMetrics.length > 0 && (
          <ul className="hubly-salud-metric-list">
            {draft.customMetrics.map((m) => (
              <li key={m.id}>
                <span>
                  {m.name} · {m.unit}: {m.value}
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  aria-label={`Eliminar métrica ${m.name}`}
                  onClick={() => handleRemoveDraftCustomMetric(m.id)}
                >
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="hubly-salud-add">
          <select
            className="hubly-cal-input"
            aria-label="Plantilla de métrica"
            value=""
            onChange={(e) => {
              const template = METRIC_TEMPLATES.flatMap((g) => g.items).find(
                (t) => t.name === e.target.value
              );
              if (!template) return;
              setNewMetricName(template.name);
              setNewMetricUnit(template.unit);
            }}
          >
            <option value="">Usar plantilla…</option>
            {METRIC_TEMPLATES.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.items.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <input
            type="text"
            className="hubly-cal-input"
            value={newMetricName}
            onChange={(e) => setNewMetricName(e.target.value)}
            placeholder="Ej. Leads calificados"
            aria-label="Nombre de métrica personalizada"
          />
          <input
            type="number"
            min={0}
            className="hubly-cal-input"
            value={newMetricValue}
            onChange={(e) => setNewMetricValue(e.target.value)}
            placeholder="Meta"
            aria-label="Valor de métrica personalizada"
          />
          <select
            className="hubly-cal-input"
            aria-label="Unidad de métrica personalizada"
            value={newMetricUnit}
            onChange={(e) => setNewMetricUnit(e.target.value as "semana" | "mes" | "total")}
          >
            <option value="semana">por semana</option>
            <option value="mes">por mes</option>
            <option value="total">total</option>
          </select>
          <Button
            variant="secondary"
            size="sm"
            disabled={!newMetricName.trim()}
            onClick={handleAddDraftCustomMetric}
          >
            <HublyCheckIcon size={15} /> Agregar
          </Button>
        </div>
      </div>

      <div className="hubly-salud-actions is-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          data-testid={`save-commitments-btn-${brandId}`}
          onClick={() => onSave(brandId, brandName)}
        >
          Guardar compromisos
        </Button>
      </div>
    </div>
  );
}
