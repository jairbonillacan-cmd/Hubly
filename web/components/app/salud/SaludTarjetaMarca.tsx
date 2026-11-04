"use client";

import React from "react";
import { useHublyStore } from "@/lib/store";
import { Button } from "@/components/app/ui/Button";
import { HublyPinIcon } from "@/components/app/icons/DuotoneIcons";
import type { EvaluatedBrandAccount } from "@/lib/domain-selectors";
import type { BrandHealthStatus } from "@/lib/types";

const STATUS_LABEL: Record<BrandHealthStatus, string> = {
  completa: "Completa",
  en_progreso: "En progreso",
  en_riesgo: "En riesgo",
  sin_compromisos: "Sin compromisos",
};

const money = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`;

interface SaludTarjetaMarcaProps {
  account: EvaluatedBrandAccount;
  periodLabel: string;
  isActive: boolean;
  isEditing: boolean;
  onToggleEdit: (account: EvaluatedBrandAccount) => void;
  children?: React.ReactNode;
}

export function SaludTarjetaMarca({
  account,
  periodLabel,
  isActive,
  isEditing,
  onToggleEdit,
  children,
}: SaludTarjetaMarcaProps) {
  const updateBrand = useHublyStore((s) => s.updateBrand);
  const setActiveBrand = useHublyStore((s) => s.setActiveBrand);

  const { brand, deliverables, customMetrics } = account;
  const tone =
    account.healthStatus === "en_riesgo"
      ? "risk"
      : account.healthStatus === "completa"
        ? "ok"
        : "mid";
  const spend = brand.monthlySpend || account.snapshot.adSpend || 0;

  return (
    <article className="hubly-salud-item" data-testid={`account-health-card-${brand.id}`}>
      <div className="hubly-salud-item-head">
        <span
          className="hubly-ajustes-dot"
          style={{ background: brand.avatarBg, color: brand.avatarColor || brand.color }}
          aria-hidden
        >
          {brand.initial}
        </span>
        <div className="hubly-salud-item-text">
          <div className="hubly-cal-row-title">
            {brand.name}
            <span className="hubly-salud-handle"> {brand.handle}</span>
          </div>
          <div className="hubly-cal-row-meta">
            {brand.industry && (
              <span className="hubly-salud-clamp">
                {brand.industry}
                {brand.city ? ` · ${brand.city}` : ""}
              </span>
            )}
          </div>
          <div className="hubly-cal-row-meta">
            <span>{account.hasPaidAds ? `Pauta activa · gastó ${money(spend)}` : "Sin pauta"}</span>
            <span>
              · Tareas {account.taskProgress}%
              {account.urgentTasksCount > 0
                ? ` · ${account.urgentTasksCount} ${account.urgentTasksCount === 1 ? "urgente" : "urgentes"}`
                : ""}
            </span>
          </div>
        </div>
        <div className="hubly-salud-actions">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${brand.pinned ? "Soltar" : "Fijar"} ${brand.name}`}
            aria-pressed={Boolean(brand.pinned)}
            title={brand.pinned ? "Soltar cuenta" : "Fijar cuenta arriba"}
            onClick={() => updateBrand(brand.id, { pinned: !brand.pinned })}
          >
            <HublyPinIcon size={15} />
          </Button>
          <span
            className="hubly-salud-status"
            data-tone={tone}
            data-testid={`account-health-badge-${brand.id}`}
          >
            {STATUS_LABEL[account.healthStatus] ?? "En progreso"} · {account.healthScore}%
          </span>
          {isActive ? (
            <span className="hubly-salud-current">Marca activa</span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              title={`Trabajar con ${brand.name}`}
              onClick={() => setActiveBrand(brand.id)}
            >
              Activar
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            aria-expanded={isEditing}
            data-testid={`edit-commitments-btn-${brand.id}`}
            onClick={() => onToggleEdit(account)}
          >
            {isEditing ? "Cerrar edición" : "Editar compromisos"}
          </Button>
        </div>
      </div>

      <div className="hubly-salud-total">
        <span>Cumplimiento total · {periodLabel}</span>
        <span data-testid={`account-fulfillment-text-${brand.id}`}>
          {account.totalCompleted} / {account.totalCommitted} entregables ({account.fulfillmentPercent}
          %)
        </span>
      </div>
      <div
        className="hubly-salud-meter"
        data-tone={tone}
        role="img"
        aria-label={`Cumplimiento ${account.fulfillmentPercent}%`}
      >
        <i style={{ width: `${Math.min(100, account.fulfillmentPercent)}%` }} />
      </div>

      <div className="hubly-salud-deliverables">
        {deliverables.map((d) => (
          <div key={d.key} className="hubly-salud-deliverable">
            <div>
              <span>{d.label}</span>
              <strong>
                {d.completed}/{d.committed}
              </strong>
            </div>
            <div className="hubly-salud-meter is-thin" data-tone={d.percent < 60 ? "risk" : "mid"}>
              <i style={{ width: `${Math.min(100, d.percent)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <p className="hubly-salud-metrics">
        <span>Métricas clave</span>
        {customMetrics.length > 0
          ? customMetrics.map((m) => `${m.name} (${m.unit}): ${m.value}`).join(" · ")
          : "Sin métricas personalizadas"}
      </p>

      {children}
    </article>
  );
}
