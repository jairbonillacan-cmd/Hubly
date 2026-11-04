"use client";

import React from "react";
import { Button } from "@/components/app/ui/Button";
import { HublyPlusIcon, HublySparkIcon } from "@/components/app/icons/DuotoneIcons";
import type {
  AccountHealthSortBy,
  AccountsHealthFilter,
  AccountsHealthSummary,
} from "@/lib/domain-selectors";
import type { CommitmentPeriod } from "@/lib/types";
import { PERIOD_OPTIONS } from "./useSaludCuentasView";

const SORT_OPTIONS: { id: AccountHealthSortBy; label: string }[] = [
  { id: "health_desc", label: "Salud: mayor a menor" },
  { id: "health_asc", label: "Salud: menor a mayor" },
  { id: "fulfillment_desc", label: "% de cumplimiento" },
  { id: "budget_desc", label: "Mayor inversión en pauta" },
  { id: "name_asc", label: "Nombre (A–Z)" },
];

interface SaludCabeceraProps {
  summary: AccountsHealthSummary;
  accountsCount: number;
  periodLabel: string;
  hasActiveFilters: boolean;
  onNewBrand: () => void;
  onOpenSuggestions: () => void;
}

export function SaludCabecera({
  summary,
  accountsCount,
  periodLabel,
  hasActiveFilters,
  onNewBrand,
  onOpenSuggestions,
}: SaludCabeceraProps) {
  const subtitle =
    summary.totalAccounts === 0
      ? "Cumplimiento de cada marca frente a lo que comprometiste."
      : hasActiveFilters
        ? `${accountsCount} de ${summary.totalAccounts} ${summary.totalAccounts === 1 ? "cuenta" : "cuentas"} · ${periodLabel}`
        : `${summary.totalAccounts} ${summary.totalAccounts === 1 ? "cuenta" : "cuentas"} · ${periodLabel}`;

  return (
    <>
      <header className="hubly-salud-head">
        <div>
          <h1 className="hubly-cal-title">Salud de cuentas</h1>
          <p className="hubly-cal-subtitle">
            {subtitle}
            {summary.totalAccounts > 0 && (
              <>
                {" · Salud promedio "}
                <strong data-testid="average-health-score">{summary.averageHealthScore}%</strong>
              </>
            )}
          </p>
        </div>
        <Button variant="secondary" onClick={onNewBrand}>
          <HublyPlusIcon size={17} /> Nueva marca
        </Button>
      </header>

      {summary.uncommittedBrandsCount > 0 && (
        <div className="hubly-salud-notice">
          <HublySparkIcon size={18} />
          <p>
            <strong>
              {summary.uncommittedBrandsCount}{" "}
              {summary.uncommittedBrandsCount === 1
                ? "marca sin compromisos"
                : "marcas sin compromisos"}
            </strong>
            Declara cuánto vas a entregar y Hubly calculará el cumplimiento y la salud de cada una.
          </p>
          <Button
            variant="secondary"
            size="sm"
            data-testid="open-suggestions-modal-btn"
            onClick={onOpenSuggestions}
          >
            Declarar compromisos
          </Button>
        </div>
      )}
    </>
  );
}

interface SaludBarraPeriodoProps {
  period: CommitmentPeriod;
  searchQuery: string;
  sortBy: AccountHealthSortBy;
  onPeriodChange: (period: CommitmentPeriod) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sortBy: AccountHealthSortBy) => void;
}

export function SaludBarraPeriodo({
  period,
  searchQuery,
  sortBy,
  onPeriodChange,
  onSearchChange,
  onSortChange,
}: SaludBarraPeriodoProps) {
  return (
    <div className="hubly-salud-toolbar">
      <div className="hubly-cal-tabs is-text" role="tablist" aria-label="Periodo">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={period === opt.id}
            className="hubly-cal-tab"
            data-testid={`period-btn-${opt.id}`}
            onClick={() => onPeriodChange(opt.id)}
          >
            <span>{opt.label}</span>
          </button>
        ))}
      </div>
      <span className="hubly-salud-spacer" />
      <input
        type="search"
        className="hubly-cal-input hubly-salud-search"
        placeholder="Buscar cuenta, @usuario o giro"
        aria-label="Buscar cuenta"
        data-testid="accounts-search-input"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="hubly-cal-input hubly-salud-sort"
        aria-label="Ordenar cuentas"
        data-testid="accounts-sort-btn"
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as AccountHealthSortBy)}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface SaludPastillasFiltroProps {
  summary: AccountsHealthSummary;
  activeFilter: AccountsHealthFilter;
  onFilterChange: (filter: AccountsHealthFilter) => void;
}

export function SaludPastillasFiltro({
  summary,
  activeFilter,
  onFilterChange,
}: SaludPastillasFiltroProps) {
  const filterPills: { id: AccountsHealthFilter; label: string; count: number }[] = [
    { id: "todas", label: "Todas", count: summary.totalAccounts },
    { id: "con_pauta", label: "Con pauta", count: summary.withPaidAdsCount },
    { id: "sin_pauta", label: "Sin pauta", count: summary.withoutPaidAdsCount },
    { id: "en_riesgo", label: "En riesgo", count: summary.atRiskCount },
    { id: "completas", label: "Completas", count: summary.completeCount },
  ];

  return (
    <div className="hubly-cal-pills hubly-salud-filters" role="group" aria-label="Filtrar cuentas">
      {filterPills.map((pill) => (
        <button
          key={pill.id}
          type="button"
          className="hubly-cal-pill"
          aria-pressed={activeFilter === pill.id}
          data-testid={`filter-pill-${pill.id}`}
          onClick={() => onFilterChange(pill.id)}
        >
          {pill.label} <span className="hubly-salud-count">{pill.count}</span>
        </button>
      ))}
    </div>
  );
}
