"use client";

import {
  type TeamAchievementItem,
} from "@/lib/domain-selectors";
import {
  HublyAwardIcon as Award,
  HublyChevronRightIcon as ChevronRight,
  HublyPeopleIcon as Users,
} from "@/components/app/icons/DuotoneIcons";
import { AchievementBadgeSvg, } from "./equipoView-shared";
import type { EquipoViewModel } from "./useEquipoView";

export function EquipoLogrosRanking({ view }: { view: EquipoViewModel }) {
  const { rankingRange, setRankingRange, setSelectedMemberId, setDrawerMemberId, currentMemberId, showAll39Achievements, setShowAll39Achievements, productivity, rankingRows, leaderPoints, activeMemberMetrics } = view;

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Left Card: Logros */}
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={15} style={{ color: "var(--hb-accent-text)" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ui-text)" }}>
                Logros
              </span>
            </div>
            <span style={{ fontSize: 11.5, color: "var(--ui-text-4)", fontWeight: 600 }}>
              {activeMemberMetrics.unlockedAchievementsCount}/
              {activeMemberMetrics.achievements.length} activos
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 140px), 1fr))",
              gap: 10,
              marginBottom: 14,
            }}
          >
            {activeMemberMetrics.achievements.map(
              (ach: TeamAchievementItem, idx: number) => {
                const progressPct = Math.min(
                  100,
                  Math.round((ach.progress / Math.max(1, ach.target)) * 100)
                );
                return (
                  <div
                    key={ach.id}
                    className={`hubly-achievement ${ach.unlocked ? "is-unlocked" : ""}`}
                    style={{
                      background: ach.unlocked ? "var(--ui-sky-soft)" : "var(--ui-surface-2)",
                      border: ach.unlocked
                        ? "1px solid var(--ui-sky-border)"
                        : "1px solid var(--ui-border)",
                      borderRadius: 12,
                      padding: "14px 10px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      position: "relative",
                    }}
                  >
                    <AchievementBadgeSvg variant={idx} unlocked={ach.unlocked} />
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: ach.unlocked ? "var(--ui-text)" : "var(--ui-text-3)",
                        marginTop: 8,
                      }}
                    >
                      {ach.title}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: ach.unlocked ? "var(--ui-sky-text)" : "var(--ui-text-4)",
                        marginTop: 2,
                        lineHeight: 1.3,
                      }}
                    >
                      {ach.description}
                    </div>

                    {/* Progress Bar & XP Pill */}
                    <div
                      style={{
                        width: "100%",
                        marginTop: 8,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: 4,
                          borderRadius: 9999,
                          background: "var(--ui-border)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${progressPct}%`,
                            height: "100%",
                            background: ach.unlocked ? "var(--hb-accent)" : "#94A3B8",
                            borderRadius: 9999,
                            transition: "width 220ms ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: 10,
                          color: ach.unlocked ? "var(--ui-sky-text)" : "var(--ui-text-4)",
                          fontWeight: 600,
                        }}
                      >
                        <span>
                          {ach.progress}/{ach.target}
                        </span>
                        <span style={{ color: "var(--hb-accent-text)" }}>+{ach.xpReward} XP</span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAll39Achievements((prev) => !prev)}
            style={{
              marginTop: "auto",
              width: "100%",
              padding: "8px",
              border: "none",
              background: "transparent",
              color: "var(--ui-text-4)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              fontFamily: "inherit",
            }}
          >
            <span>
              {showAll39Achievements
                ? `Ocultar catálogo completo (${productivity.totalAchievementsCatalog})`
                : `Ver todos los logros (${productivity.totalAchievementsCatalog})`}
            </span>
            <ChevronRight
              size={13}
              style={{
                transform: showAll39Achievements ? "rotate(90deg)" : "none",
                transition: "transform 160ms ease",
              }}
            />
          </button>
        </div>

        {/* Right Card: Ranking del Equipo */}
        <div
          style={{
            background: "var(--ui-surface)",
            border: "1px solid var(--ui-border)",
            borderRadius: 16,
            padding: "18px 22px",
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
            {rankingRows.map((member, index) => {
              const isCurrentUser = member.id === currentMemberId;
              const isSelected = member.id === activeMemberMetrics.id;
              const barWidthPct = Math.max(
                8,
                Math.round((member.displayPoints / leaderPoints) * 100)
              );
              const medal =
                index === 0
                  ? "🥇"
                  : index === 1
                    ? "🥈"
                    : index === 2
                      ? "🥉"
                      : `${index + 1}`;

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
                          fontSize: index < 3 ? 14 : 12,
                          fontWeight: 700,
                          color: isCurrentUser ? "var(--ui-text-3)" : "var(--ui-text-4)",
                          width: 18,
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        {medal}
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
                        {member.displayPoints} pts
                      </span>
                      <div style={{ fontSize: 10.5, color: isCurrentUser ? "var(--ui-text-3)" : "var(--ui-text-4)" }}>
                        Nv.{member.level} · {member.efficiencyScore} efic.
                      </div>
                    </div>
                  </div>

                  {/* Proportional Leaderboard Bar (Módulo 98919) */}
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
                          0.2 + 0.8 * (member.displayPoints / leaderPoints),
                        transition: "width 240ms ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================================================
          8B. EXPANDABLE FULL 39 ACHIEVEMENTS CATALOG
          ==================================================================== */}
    </>
  );
}
