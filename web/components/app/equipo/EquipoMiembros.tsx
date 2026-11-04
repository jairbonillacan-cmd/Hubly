"use client";

import { useState } from "react";
import { copyText } from "@/lib/clipboard";
import { useHublyStore } from "@/lib/store";
import type { EvaluatedTeamMember } from "@/lib/domain/team";
import {
  HublyCheckIcon as Check,
  HublyCopyIcon as Copy,
  HublyMailIcon as Mail,
  HublyPersonIcon as UserCheck,
} from "@/components/app/icons/DuotoneIcons";

interface EquipoMiembrosProps {
  members: EvaluatedTeamMember[];
  activeMemberId: string;
  currentMemberId: string;
  showMemberSwitcher: boolean;
  onSelectMember: (memberId: string) => void;
}

export function EquipoMiembros({
  members,
  activeMemberId,
  currentMemberId,
  showMemberSwitcher,
  onSelectMember,
}: EquipoMiembrosProps) {
  const invitations = useHublyStore((s) => s.invitations);
  const setInviteModalOpen = useHublyStore((s) => s.setInviteModalOpen);
  const acceptTeamInvitation = useHublyStore((s) => s.acceptTeamInvitation);
  const cancelTeamInvitation = useHublyStore((s) => s.cancelTeamInvitation);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);

  const handleCopyPendingLink = (inviteLink: string, id: string) => {
    const url =
      typeof window !== "undefined" && inviteLink.startsWith("/")
        ? `${window.location.origin}${inviteLink}`
        : inviteLink;
    void copyText(url).then((ok) => {
      if (!ok) return;
      setCopiedInviteId(id);
      setTimeout(() => {
        setCopiedInviteId((curr) => (curr === id ? null : curr));
      }, 2000);
    });
  };

  return (
    <>
      {showMemberSwitcher && (
        <div className="hubly-equipo-switcher">
          <span className="hubly-equipo-switcher-label">Miembros activos:</span>
          {members.map((m) => {
            const isSelected = m.id === activeMemberId;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMember(m.id)}
                data-selected={isSelected}
                className="hubly-equipo-switcher-pill"
              >
                <span>{m.name}</span>
                {m.id === currentMemberId && (
                  <span className="hubly-equipo-switcher-you">(tú)</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {invitations.length > 0 && (
        <div className="hubly-equipo-invites">
          <div className="hubly-equipo-invites-head">
            <div className="hubly-equipo-invites-title-wrap">
              <Mail size={15} color="var(--hb-accent)" />
              <span className="hubly-equipo-invites-title">
                Invitaciones del equipo ({invitations.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="hubly-equipo-invites-new-btn"
            >
              + Nueva invitación
            </button>
          </div>

          <div className="hubly-equipo-invites-list">
            {invitations.map((inv) => {
              const isPending = inv.status === "Pendiente";
              const isCopied = copiedInviteId === inv.id;
              return (
                <div key={inv.id} className="hubly-equipo-invite-card">
                  <div className="hubly-equipo-invite-info">
                    <span className="hubly-equipo-invite-name">{inv.name}</span>
                    <span className="hubly-equipo-invite-email">{inv.email}</span>
                    <span className="hubly-equipo-invite-role">{inv.role}</span>
                    <span
                      data-pending={isPending}
                      className="hubly-equipo-invite-status"
                    >
                      {inv.status}
                    </span>
                  </div>

                  <div className="hubly-equipo-invite-actions">
                    <button
                      type="button"
                      onClick={() => handleCopyPendingLink(inv.inviteLink, inv.id)}
                      className="hubly-equipo-invite-btn-copy"
                    >
                      {isCopied ? (
                        <Check size={12} color="var(--hubly-success)" />
                      ) : (
                        <Copy size={12} />
                      )}
                      <span>{isCopied ? "Enlace copiado" : "Copiar enlace"}</span>
                    </button>

                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => acceptTeamInvitation(inv.id)}
                          className="hubly-equipo-invite-btn-accept"
                        >
                          <UserCheck size={12} />
                          <span>Aceptar en modo demo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelTeamInvitation(inv.id)}
                          className="hubly-equipo-invite-btn-cancel"
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
    </>
  );
}
