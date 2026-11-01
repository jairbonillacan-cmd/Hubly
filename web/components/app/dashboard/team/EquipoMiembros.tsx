"use client";

import {
  type EvaluatedTeamMember,
} from "@/lib/domain-selectors";
import {
  HublyCheckIcon as Check,
  HublyCopyIcon as Copy,
  HublyMailIcon as Mail,
  HublyPersonIcon as UserCheck,
} from "@/components/app/icons/DuotoneIcons";
import type { EquipoViewModel } from "./useEquipoView";

export function EquipoMiembros({ view }: { view: EquipoViewModel }) {
  const { invitations, setInviteModalOpen, acceptTeamInvitation, cancelTeamInvitation, setSelectedMemberId, currentMemberId, showAllTeamScope, copiedInviteId, productivity, activeMemberMetrics, acceptedExtraMembersCount, handleCopyPendingLink } = view;

  return (
    <>
      {(showAllTeamScope || acceptedExtraMembersCount > 0) && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginBottom: 18,
            padding: "8px 12px",
            borderRadius: 12,
            background: "var(--ui-surface-2)",
            border: "1px solid var(--ui-border)",
          }}
        >
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ui-text-4)" }}>
            Miembros activos:
          </span>
          {productivity.ranking.map((m: EvaluatedTeamMember) => {
            const isSelected = m.id === activeMemberMetrics.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMemberId(m.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 9999,
                  border: isSelected
                    ? "1px solid var(--hb-accent)"
                    : "1px solid #E2E8F0",
                  background: isSelected ? "var(--ui-accent-soft)" : "var(--ui-surface)",
                  color: isSelected ? "var(--hb-accent-text)" : "var(--ui-text-2)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>{m.name}</span>
                {m.id === currentMemberId && (
                  <span style={{ fontSize: 10.5, opacity: 0.75 }}>(tú)</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Pending Invitations Banner (visible when user has created invitations) */}
      {invitations.length > 0 && (
        <div
          style={{
            marginBottom: 22,
            padding: "14px 18px",
            borderRadius: 14,
            border: "1px solid #BFE2F4",
            background: "var(--ui-accent-soft)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Mail size={15} color="var(--hb-accent)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text)" }}>
                Invitaciones del equipo ({invitations.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              style={{
                border: "none",
                background: "transparent",
                color: "var(--hb-accent-text)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + Nueva invitación
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {invitations.map((inv) => {
              const isPending = inv.status === "Pendiente";
              const isCopied = copiedInviteId === inv.id;
              return (
                <div
                  key={inv.id}
                  style={{
                    background: "var(--ui-surface)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    border: "1px solid #DCEFF9",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ui-text)" }}>
                        {inv.name}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--ui-text-4)" }}>
                        {inv.email}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: 9999,
                          background: "var(--ui-muted)",
                          color: "var(--ui-text-3)",
                        }}
                      >
                        {inv.role}
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 9999,
                          background: isPending ? "#E6F4FB" : "#DCFCE7",
                          color: isPending ? "var(--ui-accent-text)" : "#15803D",
                        }}
                      >
                        {inv.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleCopyPendingLink(inv.inviteLink, inv.id)}
                      style={{
                        height: 28,
                        padding: "0 10px",
                        borderRadius: 7,
                        border: "1px solid var(--ui-border-strong)",
                        background: "var(--ui-surface)",
                        color: "var(--ui-text-2)",
                        fontSize: 11.5,
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        cursor: "pointer",
                      }}
                    >
                      {isCopied ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      <span>{isCopied ? "¡Enlace copiado!" : "Copiar enlace"}</span>
                    </button>

                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => acceptTeamInvitation(inv.id)}
                          style={{
                            height: 28,
                            padding: "0 10px",
                            borderRadius: 7,
                            border: "none",
                            background: "var(--hb-accent)",
                            color: "#FFFFFF",
                            fontSize: 11.5,
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer",
                          }}
                        >
                          <UserCheck size={12} />
                          <span>Aceptar en modo demo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelTeamInvitation(inv.id)}
                          style={{
                            height: 28,
                            padding: "0 8px",
                            borderRadius: 7,
                            border: "1px solid #FECACA",
                            background: "#FEF2F2",
                            color: "#DC2626",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====================================================================
          2. MEMBER PROFILE BLOCK (80x80 Squircle Avatar + Name + Role + Editar marcas)
          ==================================================================== */}
    </>
  );
}
