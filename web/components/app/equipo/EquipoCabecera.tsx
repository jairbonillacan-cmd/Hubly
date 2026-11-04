"use client";

import {
  HublyCloseIcon as X,
  HublyPersonIcon as UserPlus,
  HublySearchIcon as Search,
  HublySlidersIcon as SlidersHorizontal,
} from "@/components/app/icons/DuotoneIcons";
import type { EquipoViewModel } from "./useEquipoView";

export function EquipoCabecera({ view }: { view: EquipoViewModel }) {
  const { brands, setInviteModalOpen, teamPeriod, setTeamPeriod, searchQuery, setSearchQuery, setSelectedMemberId, currentMemberId, showAllTeamScope, setShowAllTeamScope, filtersOpen, setFiltersOpen, filtersPresence, brandFilterId, setBrandFilterId, syncedTeam, displayedPersonCount, handleQuickRecordActivity, handleCompleteNextInProgressTask, pendingInvitations } = view;

  return (
    <>
      {/* ====================================================================
          1. TOP HEADER ROW: Equipo · N persona(s) | 7d/30d/90d | Search | Invitar | Filtros
          ==================================================================== */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--ui-text)",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Equipo · {displayedPersonCount}{" "}
            {displayedPersonCount === 1 ? "persona" : "personas"}
          </h2>

          {brandFilterId !== "all" && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 9px",
                borderRadius: 9999,
                background: "var(--ui-accent-soft)",
                color: "var(--hb-accent-text)",
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              <span>
                Marca: {brands.find((b) => b.id === brandFilterId)?.name ?? brandFilterId}
              </span>
              <button
                type="button"
                onClick={() => setBrandFilterId("all")}
                aria-label="Quitar filtro de marca"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--hb-accent-text)",
                  cursor: "pointer",
                  padding: 0,
                  display: "inline-flex",
                }}
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>

        {/* Right Controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            position: "relative",
          }}
        >
          {/* Period Pill Selector: 7 días | 30 días | 90 días */}
          <div
            role="group"
            aria-label="Periodo de métricas de equipo"
            style={{
              display: "inline-flex",
              background: "var(--ui-muted)",
              padding: 3,
              borderRadius: 10,
              gap: 2,
            }}
          >
            {(
              [
                { id: "7d", label: "7 días" },
                { id: "30d", label: "30 días" },
                { id: "90d", label: "90 días" },
              ] as const
            ).map((p) => {
              const active = teamPeriod === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTeamPeriod(p.id)}
                  className="hubly-seg-pill"
                  style={{
                    border: "none",
                    background: active ? "var(--ui-surface)" : "transparent",
                    color: active ? "var(--ui-text)" : "var(--ui-text-3)",
                    fontWeight: active ? 600 : 500,
                    fontSize: 12,
                    padding: "5px 11px",
                    borderRadius: 7,
                    cursor: "pointer",
                    boxShadow: active
                      ? "0 1px 2px rgba(15, 23, 42, 0.06)"
                      : "none",
                    fontFamily: "inherit",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              flex: "1 1 180px",
              maxWidth: 220,
            }}
          >
            <Search
              size={13.5}
              style={{
                position: "absolute",
                left: 11,
                color: "var(--ui-text-4)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar miembro o marca..."
              aria-label="Buscar miembro o marca"
              style={{
                height: 34,
                width: "100%",
                padding: "0 28px 0 32px",
                borderRadius: 10,
                border: "1px solid var(--ui-border)",
                background: "var(--ui-surface)",
                fontSize: 12.5,
                color: "var(--ui-text)",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Limpiar búsqueda"
                style={{
                  position: "absolute",
                  right: 8,
                  border: "none",
                  background: "transparent",
                  color: "var(--ui-text-4)",
                  cursor: "pointer",
                  padding: 2,
                  display: "inline-flex",
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Invitar Button */}
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="hbtn-indigo"
            style={{
              height: 34,
              fontSize: 12.5,
              padding: "0 14px",
              borderRadius: 10,
            }}
          >
            <UserPlus size={13.5} />
            <span>Invitar</span>
            {pendingInvitations.length > 0 && (
              <span
                style={{
                  marginLeft: 2,
                  padding: "1px 6px",
                  borderRadius: 9999,
                  background: "rgba(255, 255, 255, 0.22)",
                  fontSize: 10.5,
                  fontWeight: 700,
                }}
              >
                {pendingInvitations.length}
              </span>
            )}
          </button>

          {/* Filtros Button */}
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="hbtn-outline"
            aria-expanded={filtersOpen}
            style={{
              height: 34,
              fontSize: 12.5,
              padding: "0 12px",
              borderRadius: 10,
              color: filtersOpen ? "var(--hb-accent-text)" : "var(--ui-text-3)",
              borderColor: filtersOpen ? "#BFE2F4" : "var(--ui-border)",
              background: filtersOpen ? "var(--ui-accent-soft)" : "var(--ui-surface)",
            }}
          >
            <SlidersHorizontal size={13} />
            <span>Filtros</span>
          </button>

          {/* Filtros Popover */}
          {filtersPresence.mounted && (
            <div
              className="hubly-dropdown"
              data-state={filtersPresence.state}
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 290,
                maxWidth: "calc(100vw - 32px)",
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 14,
                padding: 14,
                zIndex: 50,
                boxShadow: "0 16px 36px rgba(15, 23, 42, 0.14)",
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--ui-text-3)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Alcance del equipo
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <button
                  type="button"
                  aria-pressed={!showAllTeamScope}
                  onClick={() => {
                    setShowAllTeamScope(false);
                    setSelectedMemberId(currentMemberId);
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: !showAllTeamScope
                      ? "1px solid var(--hb-accent)"
                      : "1px solid var(--ui-border)",
                    background: !showAllTeamScope ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    color: !showAllTeamScope ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Mi vista (1)
                </button>
                <button
                  type="button"
                  aria-pressed={showAllTeamScope}
                  onClick={() => setShowAllTeamScope(true)}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: showAllTeamScope
                      ? "1px solid var(--hb-accent)"
                      : "1px solid var(--ui-border)",
                    background: showAllTeamScope ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    color: showAllTeamScope ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Todo el equipo ({syncedTeam.length})
                </button>
              </div>

              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "var(--ui-text-3)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Filtrar por marca
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                <button
                  type="button"
                  aria-pressed={brandFilterId === "all"}
                  onClick={() => setBrandFilterId("all")}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 7,
                    border:
                      brandFilterId === "all"
                        ? "1px solid var(--hb-accent)"
                        : "1px solid #E2E8F0",
                    background: brandFilterId === "all" ? "var(--ui-accent-soft)" : "var(--ui-surface)",
                    color: brandFilterId === "all" ? "var(--hb-accent)" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Todas
                </button>
                {brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={brandFilterId === b.id}
                    onClick={() => setBrandFilterId(b.id)}
                    style={{
                      padding: "4px 9px",
                      borderRadius: 7,
                      border:
                        brandFilterId === b.id
                          ? "1px solid var(--hb-accent)"
                          : "1px solid #E2E8F0",
                      background: brandFilterId === b.id ? "var(--ui-accent-soft)" : "var(--ui-surface)",
                      color: brandFilterId === b.id ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              <div
                style={{
                  paddingTop: 10,
                  borderTop: "1px solid var(--ui-muted)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    handleCompleteNextInProgressTask();
                    setFiltersOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--ui-border)",
                    background: "var(--ui-surface-2)",
                    color: "var(--ui-text)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Completar tarea en curso</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleQuickRecordActivity();
                    setFiltersOpen(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid var(--ui-border)",
                    background: "var(--ui-surface-2)",
                    color: "var(--ui-text)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Registrar entrega activa</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Optional Member Switcher Bar when viewing All Team or when extra members were invited */}
    </>
  );
}
