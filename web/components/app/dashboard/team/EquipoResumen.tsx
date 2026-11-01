"use client";

import {
  HublyCheckIcon as Check,
  HublyPencilIcon as Pencil,
} from "@/components/app/icons/DuotoneIcons";
import type { EquipoViewModel } from "./useEquipoView";

export function EquipoResumen({ view }: { view: EquipoViewModel }) {
  const { profile, brands, teamPeriod, editingBrandsOpen, setEditingBrandsOpen, activeMemberMetrics, isPrimaryOwner, assignedBrands, handleToggleBrandForMember } = view;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 20,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* 80x80 Squircle Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: "var(--ui-accent-soft)",
              color: "var(--hb-accent-text)",
              fontSize: 28,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {activeMemberMetrics.avatarInitial.slice(0, 1)}
          </div>

          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--ui-text)",
                margin: 0,
                lineHeight: 1.25,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{isPrimaryOwner ? profile.name : activeMemberMetrics.name}</span>
              {isPrimaryOwner && (
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ui-text-4)" }}>(tú)</span>
              )}
            </h3>
            <div
              style={{
                fontSize: 13,
                color: "var(--ui-text-4)",
                marginTop: 2,
              }}
            >
              {isPrimaryOwner ? profile.role : activeMemberMetrics.role}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ui-text-4)",
                marginTop: 2,
              }}
            >
              {assignedBrands.length}{" "}
              {assignedBrands.length === 1 ? "marca" : "marcas"}
            </div>
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setEditingBrandsOpen((prev) => !prev)}
            className="hbtn-outline"
            aria-expanded={editingBrandsOpen}
            style={{
              fontSize: 12.5,
              padding: "6px 12px",
              borderRadius: 9,
              background: "transparent",
              color: "var(--ui-text-3)",
            }}
          >
            <Pencil size={12.5} />
            <span>Editar marcas</span>
          </button>

          {editingBrandsOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                width: 250,
                background: "var(--ui-surface)",
                border: "1px solid var(--ui-border)",
                borderRadius: 12,
                padding: 12,
                zIndex: 45,
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--ui-text)",
                  marginBottom: 8,
                }}
              >
                Marcas asignadas a {activeMemberMetrics.name}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {brands.map((b) => {
                  const isAssigned = assignedBrands.some((ab) => ab.id === b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      aria-pressed={isAssigned}
                      onClick={() => handleToggleBrandForMember(b.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 8px",
                        borderRadius: 8,
                        border: "none",
                        background: isAssigned ? "var(--ui-accent-soft)" : "transparent",
                        color: isAssigned ? "var(--hb-accent-text)" : "var(--ui-text-2)",
                        fontSize: 12.5,
                        fontWeight: isAssigned ? 600 : 500,
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            background: b.id === "brand-min" ? "#16324F" : b.color,
                            color: "#FFFFFF",
                            fontSize: 9.5,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {b.initials.slice(0, 1)}
                        </span>
                        <span>{b.name}</span>
                      </span>
                      {isAssigned && <Check size={13} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================
          3. PASSIVE METRICS STRIP (TAREAS | POSTS | TIEMPO)
          ==================================================================== */}
      <div
        style={{
          background: "var(--ui-surface-2)",
          borderRadius: 14,
          padding: "18px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 28,
          marginBottom: 18,
        }}
      >
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ui-text-4)" }}>
          {teamPeriod === "7d" ? "Últimos 7 días" : teamPeriod === "90d" ? "Últimos 90 días" : "Últimos 30 días"}
        </span>
        {/* TAREAS */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: 14,
          }}
        >
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--ui-text-4)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            TAREAS
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong
              style={{
                color: "var(--ui-text)",
                fontWeight: 700,
                fontSize: 18,
                marginRight: 4,
              }}
            >
              {activeMemberMetrics.completedTasksCount > 0
                ? activeMemberMetrics.completedTasksCount
                : "—"}
            </strong>
            terminadas
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong
              style={{
                color: "var(--ui-text)",
                fontWeight: 700,
                fontSize: 15,
                marginRight: 4,
              }}
            >
              {activeMemberMetrics.inProgressTasksCount}
            </strong>
            en curso
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong
              style={{
                color: "var(--ui-text-4)",
                fontWeight: 700,
                fontSize: 15,
                marginRight: 4,
              }}
            >
              {activeMemberMetrics.avgCycleFormatted}
            </strong>
            por tarea
          </span>
        </div>

        {/* Vertical Divider */}
        <div
          style={{
            width: 1,
            height: 22,
            background: "var(--ui-border)",
            flexShrink: 0,
          }}
        />

        {/* POSTS */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--ui-text-4)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            POSTS
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong
              style={{
                color: "var(--ui-text)",
                fontWeight: 700,
                fontSize: 18,
                marginRight: 4,
              }}
            >
              {activeMemberMetrics.publishedPostsCount > 0
                ? activeMemberMetrics.publishedPostsCount
                : "—"}
            </strong>
            publicados
          </span>
        </div>

        {/* Vertical Divider */}
        <div
          style={{
            width: 1,
            height: 22,
            background: "var(--ui-border)",
            flexShrink: 0,
          }}
        />

        {/* TIEMPO */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "var(--ui-text-4)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            TIEMPO
          </span>
          <span style={{ fontSize: 13.5, color: "var(--ui-text-4)" }}>
            <strong style={{ color: "var(--ui-text)", fontWeight: 700, fontSize: 14.5 }}>
              {activeMemberMetrics.activeTimeFormatted}
            </strong>{" "}
            activo
          </span>
        </div>
      </div>

      {/* ====================================================================
          4. ASSIGNED BRAND SQUIRCLE BADGES (e.g. "M" / "Min")
          ==================================================================== */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {assignedBrands.map((b) => (
          <div
            key={b.id}
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "var(--ui-accent-soft)",
                color: "var(--hb-accent-text)",
                fontSize: 16,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {b.initials.slice(0, 1)}
            </div>
            <span style={{ fontSize: 11.5, color: "var(--ui-text-3)", fontWeight: 500 }}>
              {b.name}
            </span>
          </div>
        ))}
      </div>

      {/* ====================================================================
          5. EXPLANATORY PARAGRAPH (Ciclo típico & Tiempo activo)
          ==================================================================== */}
    </>
  );
}
