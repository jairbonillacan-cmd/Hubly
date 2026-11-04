"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { useHublyStore } from "@/lib/store";
import type { TeamProductivityPeriod } from "@/lib/domain/team";
import {
  HublyCloseIcon as X,
  HublyPersonIcon as UserPlus,
  HublySearchIcon as Search,
} from "@/components/app/icons/DuotoneIcons";

const PERIOD_OPTIONS = [
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "90d", label: "90 días" },
] as const;

interface EquipoCabeceraProps {
  displayedPersonCount: number;
  teamPeriod: TeamProductivityPeriod;
  onTeamPeriodChange: (period: TeamProductivityPeriod) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  brandFilter: { label: string; onClear: () => void } | null;
  children: ReactNode;
}

export function EquipoCabecera({
  displayedPersonCount,
  teamPeriod,
  onTeamPeriodChange,
  searchQuery,
  onSearchQueryChange,
  brandFilter,
  children,
}: EquipoCabeceraProps) {
  const invitations = useHublyStore((s) => s.invitations);
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
  const pendingCount = useMemo(
    () => invitations.filter((i) => i.status === "Pendiente").length,
    [invitations]
  );

  return (
    <div className="hubly-equipo-header">
      <div className="hubly-equipo-header-left">
        <h2 className="hubly-equipo-title">
          Equipo · {displayedPersonCount}{" "}
          {displayedPersonCount === 1 ? "persona" : "personas"}
        </h2>

        {brandFilter && (
          <span className="hubly-equipo-brand-chip">
            <span>Marca: {brandFilter.label}</span>
            <button
              type="button"
              onClick={brandFilter.onClear}
              aria-label="Quitar filtro de marca"
              className="hubly-equipo-brand-chip-clear"
            >
              <X size={12} />
            </button>
          </span>
        )}
      </div>

      <div className="hubly-equipo-header-right">
        <div
          role="group"
          aria-label="Periodo de métricas de equipo"
          className="hubly-equipo-period-group"
        >
          {PERIOD_OPTIONS.map((p) => {
            const active = teamPeriod === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => onTeamPeriodChange(p.id)}
                className="hubly-seg-pill hubly-equipo-period-pill"
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="hubly-equipo-search-wrap">
          <Search size={13.5} className="hubly-equipo-search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Buscar miembro o marca..."
            aria-label="Buscar miembro o marca"
            className="hubly-equipo-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              aria-label="Limpiar búsqueda"
              className="hubly-equipo-search-clear"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setInviteModalOpen(true)}
          className="hbtn-indigo hubly-equipo-invite-btn"
        >
          <UserPlus size={13.5} />
          <span>Invitar</span>
          {pendingCount > 0 && (
            <span className="hubly-equipo-invite-badge">{pendingCount}</span>
          )}
        </button>

        {children}
      </div>
    </div>
  );
}
