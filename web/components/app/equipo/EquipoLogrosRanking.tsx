"use client";

import { useState } from "react";
import type { TeamRankingRow } from "@/lib/domain/team";
import { MemberDrawer } from "@/components/app/equipo/MemberDrawer";
import { HublyPeopleIcon as Users } from "@/components/app/icons/DuotoneIcons";

interface EquipoLogrosRankingProps {
  rankingRange: "Hoy" | "Semana" | "Mes";
  onRankingRangeChange: (range: "Hoy" | "Semana" | "Mes") => void;
  rankingRows: TeamRankingRow[];
  leaderDeliverables: number;
  activeMemberId: string;
  currentMemberId: string;
  onSelectMember: (memberId: string) => void;
}

export function EquipoLogrosRanking({
  rankingRange,
  onRankingRangeChange,
  rankingRows,
  leaderDeliverables,
  activeMemberId,
  currentMemberId,
  onSelectMember,
}: EquipoLogrosRankingProps) {
  const [drawerMemberId, setDrawerMemberId] = useState<string | null>(null);

  return (
    <>
      <div className="hubly-equipo-card">
        <div className="hubly-equipo-card-head">
          <div className="hubly-equipo-card-title-wrap">
            <Users size={15} className="hubly-equipo-card-icon" />
            <span className="hubly-equipo-card-title">Ranking del Equipo</span>
          </div>

          <div className="hubly-equipo-seg-group">
            {(["Hoy", "Semana", "Mes"] as const).map((r) => {
              const active = rankingRange === r;
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onRankingRangeChange(r)}
                  className="hubly-seg-pill hubly-equipo-seg-btn"
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <div className="hubly-equipo-rows-list">
          {rankingRows.map((member) => {
            const isCurrentUser = member.id === currentMemberId;
            const isSelected = member.id === activeMemberId;
            const barWidthPct = Math.max(
              8,
              Math.round((member.deliverablesCount / leaderDeliverables) * 100)
            );

            return (
              <div
                key={member.id}
                onClick={() => onSelectMember(member.id)}
                role="button"
                aria-pressed={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectMember(member.id);
                  }
                }}
                data-highlight={isCurrentUser || isSelected}
                className="hubly-equipo-rank-row"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDrawerMemberId(member.id);
                  }}
                  className="hubly-equipo-rank-profile-btn"
                >
                  Ver perfil
                </button>
                <div className="hubly-equipo-rank-main">
                  <div className="hubly-equipo-rank-left">
                    <span
                      data-current={isCurrentUser}
                      className="hubly-equipo-rank-pos"
                    >
                      {member.rankPosition}
                    </span>
                    <div
                      data-current={isCurrentUser}
                      className="hubly-equipo-rank-avatar"
                    >
                      {member.avatarInitial.slice(0, 1)}
                    </div>
                    <div className="hubly-equipo-rank-info">
                      <div className="hubly-equipo-rank-name">
                        {member.name}{" "}
                        {isCurrentUser && (
                          <span className="hubly-equipo-rank-you">(tú)</span>
                        )}
                      </div>
                      <div
                        data-current={isCurrentUser}
                        className="hubly-equipo-rank-sub"
                      >
                        {member.role} · {member.completedTasksCount} tareas ·{" "}
                        {member.publishedPostsCount} posts
                      </div>
                    </div>
                  </div>

                  <div className="hubly-equipo-rank-right">
                    <span
                      data-current={isCurrentUser}
                      className="hubly-equipo-rank-deliveries"
                    >
                      {member.deliverablesCount}{" "}
                      {member.deliverablesCount === 1 ? "entrega" : "entregas"}
                    </span>
                    <div
                      data-current={isCurrentUser}
                      className="hubly-equipo-rank-cycle"
                    >
                      {member.activeTimeFormatted} · {member.avgCycleFormatted} por tarea
                    </div>
                  </div>
                </div>

                <div
                  data-current={isCurrentUser}
                  className="hubly-equipo-rank-bar-track"
                >
                  <div
                    data-current={isCurrentUser}
                    className="hubly-equipo-rank-bar-fill"
                    style={{
                      width: `${barWidthPct}%`,
                      opacity:
                        0.2 + 0.8 * (member.deliverablesCount / leaderDeliverables),
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
