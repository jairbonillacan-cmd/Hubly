"use client";

import { MemberDrawer } from "@/components/app/dashboard/MemberDrawer";
import {
  HublyAwardIcon,
  HublyChevronDownIcon as ChevronDown,
} from "@/components/app/icons/DuotoneIcons";
import { XP_LEVEL_TIERS, EFFORT_CATEGORIES } from "./equipoView-shared";
import type { EquipoViewModel } from "./useEquipoView";

export function EquipoCatalogo({ view }: { view: EquipoViewModel }) {
  const { drawerMemberId, setDrawerMemberId, showAll39Achievements, setShowAll39Achievements, achievementCategoryFilter, setAchievementCategoryFilter, pointsAccordionOpen, setPointsAccordionOpen, filteredCatalogAchievements } = view;

  return (
    <>
      {showAll39Achievements && (
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            padding: "20px 22px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--ui-text)" }}>
                Catálogo completo de logros (39)
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ui-text-4)" }}>
                Desbloqueados por actividad real en tareas, contenido, proyectos, CRM y Hubly AI
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAll39Achievements(false)}
              className="hbtn-outline"
              style={{ height: 30, fontSize: 12, padding: "0 10px" }}
            >
              Cerrar catálogo
            </button>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 16,
            }}
          >
            {[
              "Todos",
              "Generales",
              "Tareas",
              "Proyectos",
              "CRM",
              "Contenido",
              "Social",
              "Analytics",
              "Inteligencia",
              "Hubly AI",
              "Chat & Marca",
            ].map((cat) => {
              const active = achievementCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAchievementCategoryFilter(cat)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 9999,
                    border: active ? "1px solid var(--hb-accent)" : "1px solid var(--ui-border)",
                    background: active ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                    color: active ? "var(--hb-accent-text)" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 210px), 1fr))",
              gap: 10,
            }}
          >
            {filteredCatalogAchievements.map((item) => {
              const pct = Math.min(
                100,
                Math.round((item.progress / Math.max(1, item.target)) * 100)
              );
              return (
                <div
                  key={item.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: item.unlocked
                      ? "1px solid var(--ui-sky-border)"
                      : "1px solid var(--ui-border)",
                    background: item.unlocked ? "var(--ui-sky-soft)" : "var(--ui-surface-2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <HublyAwardIcon size={18} />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 9999,
                        background: item.unlocked ? "#DCFCE7" : "var(--ui-border)",
                        color: item.unlocked ? "#15803D" : "var(--ui-text-3)",
                      }}
                    >
                      +{item.xpReward} XP
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ui-text)" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: item.unlocked ? "var(--ui-sky-text)" : "var(--ui-text-4)", lineHeight: 1.35 }}>
                    {item.description}
                  </div>
                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 6,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 10.5,
                      color: item.unlocked ? "var(--ui-sky-text)" : "var(--ui-text-4)",
                      fontWeight: 600,
                    }}
                  >
                    <span>{item.category}</span>
                    <span>
                      {item.progress}/{item.target} ({pct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          9. BOTTOM ACCORDION: Cómo funcionan los puntos
          ==================================================================== */}
      <div
        style={{
          background: "var(--ui-surface)",
          border: "1px solid var(--ui-border)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <button
          type="button"
          onClick={() => setPointsAccordionOpen((prev) => !prev)}
          aria-expanded={pointsAccordionOpen}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text-2)" }}>
              Cómo funcionan los puntos
            </span>
            <span style={{ fontSize: 12, color: "var(--ui-text-4)" }}>
              · Se miden por esfuerzo, no por clicks
            </span>
          </div>
          <ChevronDown
            size={15}
            style={{
              color: "var(--ui-text-4)",
              transform: pointsAccordionOpen ? "rotate(180deg)" : "none",
              transition: "transform 180ms ease",
              flexShrink: 0,
            }}
          />
        </button>

        {pointsAccordionOpen && (
          <div
            style={{
              padding: "0 20px 20px",
              borderTop: "1px solid var(--ui-muted)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* 4 Effort Categories */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
                gap: 10,
                marginTop: 14,
              }}
            >
              {EFFORT_CATEGORIES.map((cat) => (
                <div
                  key={cat.title}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: cat.bg,
                    border: "1px solid rgba(15, 23, 42, 0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: "var(--ui-text)",
                      }}
                    >
                      {cat.title}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: cat.color,
                      }}
                    >
                      {cat.points}
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11.5,
                      color: "var(--ui-text-3)",
                      lineHeight: 1.45,
                    }}
                  >
                    {cat.examples}
                  </p>
                </div>
              ))}
            </div>

            {/* 5 XP Level Tiers */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--ui-surface-2)",
                border: "1px solid var(--ui-border)",
              }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ui-text-3)" }}>
                Niveles de progresión:
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {XP_LEVEL_TIERS.map((tier) => (
                  <span
                    key={tier.level}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11.5,
                      color: "var(--ui-text-2)",
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 9999,
                        background: tier.color,
                      }}
                    />
                    <span>
                      Nv.{tier.level} {tier.name} ({tier.minXp} XP)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      {drawerMemberId && (<MemberDrawer memberId={drawerMemberId} onClose={() => setDrawerMemberId(null)} />)}
    </>
  );
}
