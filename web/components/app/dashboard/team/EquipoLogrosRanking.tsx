"use client";

import { MemberDrawer } from "@/components/app/dashboard/MemberDrawer";
import {
  HublyPeopleIcon as Users,
} from "@/components/app/icons/DuotoneIcons";
import type { EquipoViewModel } from "./useEquipoView";

export function EquipoLogrosRanking({ view }: { view: EquipoViewModel }) {
  const { rankingRange, setRankingRange, setSelectedMemberId, drawerMemberId, setDrawerMemberId, currentMemberId, rankingRows, leaderDeliverables, activeMemberMetrics } = view;

  return (
    <>
      <div
        style={{
          background: "var(--ui-surface)",
          border: "1px solid var(--ui-border)",
          borderRadius: 16,
          padding: "18px 22px",
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={15} style={{ color: "var(--hb-accent-text)" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>
              Ranking del Equipo
            </span>
          </div>

          <div
            style={{
              display: "inline-flex",
              background: "var(--ui-muted)",
              padding: 2,
              borderRadius: 8,
            }}
          >
            {(["Hoy", "Semana", "Mes"] as const).map((r) => {
              const active = rankingRange === r;
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRankingRange(r)}
                  className="hubly-seg-pill"
                  style={{
                    border: "none",
                    background: active ? "var(--hb-accent)" : "transparent",
                    color: active ? "#FFFFFF" : "var(--ui-text-3)",
                    fontSize: 11.5,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ranking Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rankingRows.map((member) => {
            const isCurrentUser = member.id === currentMemberId;
            const isSelected = member.id === activeMemberMetrics.id;
            const barWidthPct = Math.max(
              8,
              Math.round((member.deliverablesCount / leaderDeliverables) * 100)
            );

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                role="button"
                aria-pressed={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedMemberId(member.id);
                  }
                }}
                style={{
                  background: isCurrentUser || isSelected ? "var(--ui-accent-soft)" : "var(--ui-surface-2)",
                  border:
                    isCurrentUser || isSelected
                      ? "1px solid #DCEFF9"
                      : "1px solid #F1F5F9",
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  cursor: "pointer",
                  transition: "background 150ms ease, border-color 150ms ease",
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDrawerMemberId(member.id);
                  }}
                  style={{ order: 1, alignSelf: "flex-end", border: 0, background: "transparent", color: "var(--ui-accent-text-2)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
                >
                  Ver perfil
                </button>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isCurrentUser ? "var(--ui-text-3)" : "var(--ui-text-4)",
                        width: 18,
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      {member.rankPosition}
                    </span>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 9999,
                        background: isCurrentUser ? "var(--ui-sky-border)" : "var(--ui-border)",
                        color: isCurrentUser ? "var(--hb-accent-text)" : "var(--ui-text-2)",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {member.avatarInitial.slice(0, 1)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "var(--ui-text)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {member.name}{" "}
                        {isCurrentUser && (
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 500,
                              color: "var(--hb-accent-text)",
                            }}
                          >
                            (tú)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: isCurrentUser ? "var(--ui-text-3)" : "var(--ui-text-4)" }}>
                        {member.role} · {member.completedTasksCount} tareas ·{" "}
                        {member.publishedPostsCount} posts
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: isCurrentUser ? "var(--hb-accent-text)" : "var(--ui-text)",
                      }}
                    >
                      {member.deliverablesCount}{" "}
                      {member.deliverablesCount === 1 ? "entrega" : "entregas"}
                    </span>
                    <div style={{ fontSize: 10.5, color: isCurrentUser ? "var(--ui-text-3)" : "var(--ui-text-4)" }}>
                      {member.activeTimeFormatted} · {member.avgCycleFormatted} por tarea
                    </div>
                  </div>
                </div>

                {/* Barra proporcional de entregas del periodo */}
                <div
                  style={{
                    width: "100%",
                    height: 4,
                    borderRadius: 9999,
                    background: isCurrentUser ? "#DCEFF9" : "var(--ui-border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${barWidthPct}%`,
                      height: "100%",
                      borderRadius: 9999,
                      background: isCurrentUser ? "var(--hb-accent)" : "#64748B",
                      opacity:
                        0.2 + 0.8 * (member.deliverablesCount / leaderDeliverables),
                      transition: "width 240ms ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {drawerMemberId && (
        <MemberDrawer
          memberId={drawerMemberId}
          onClose={() => setDrawerMemberId(null)}
        />
      )}
    </>
  );
}
