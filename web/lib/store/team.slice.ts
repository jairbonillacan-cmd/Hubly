import type { StateCreator } from "zustand";
import { createActivityItem } from "../domain/activity";
import { INITIAL_WORKSPACE_DATA } from "../seed-data";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { ActivityEvent, TeamInvitation, TeamMember } from "../types";

export interface TeamSlice {
  teamMembers: TeamMember[];

  inviteTeamMember: (input: {
    email: string;
    name?: string;
    role: string;
    brandIds?: string[];
  }) => TeamInvitation;
  acceptTeamInvitation: (invitationId: string) => void;
  cancelTeamInvitation: (invitationId: string) => void;
  updateTeamMember: (memberId: string, patch: Partial<TeamMember>) => void;
  recordActivityEvent: (
    event: Omit<ActivityEvent, "id" | "timestamp"> & { timestamp?: string }
  ) => void;
}

export const createTeamSlice: StateCreator<HublyStoreState, [], [], TeamSlice> = (set, get) => ({
  teamMembers: INITIAL_WORKSPACE_DATA.team,

  inviteTeamMember: (input) => {
    const nowIso = new Date().toISOString();
    const cleanEmail = input.email.trim().toLowerCase();
    const rawName =
      input.name?.trim() ||
      cleanEmail
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()) ||
      "Nuevo Miembro";

    const brandIds =
      input.brandIds && input.brandIds.length > 0
        ? input.brandIds
        : [get().activeBrandId];

    const invitation: TeamInvitation = {
      id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      email: cleanEmail,
      name: rawName,
      role: input.role || "Content Creator",
      brandIds,
      createdAt: nowIso,
      status: "Pendiente",
      inviteLink: `https://hubly.cm/invite/${Date.now().toString(36)}`,
    };

    const initials = rawName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

    const newMember: TeamMember = {
      id: `tm-${Date.now()}`,
      name: rawName,
      initials: initials || "NM",
      avatarInitial: initials.slice(0, 1) || "N",
      avatarColor: "#4338ca",
      role: invitation.role,
      email: cleanEmail,
      status: "Invitado",
      baseActiveMinutes: 15,
      brandIds,
      brandsCount: brandIds.length,
      tasksCompleted: 0,
      tasksInProgress: 0,
      postsPublished: 0,
      activeTimeLabel: "menos de un minuto",
      points: 50,
    };

    set((s) => {
      const event = createActivityItem(s, {
        type: "session_active",
        brandId: s.activeBrandId,
        durationMinutes: 5,
        metadata: { invitedEmail: cleanEmail, role: invitation.role },
      });

      return {
        invitations: [invitation, ...s.invitations],
        team: [...s.team, newMember],
        teamMembers: [...s.team, newMember],
        onboarding: {
          ...s.onboarding,
          teamCheckedOrInvited: true,
        },
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
    return invitation;
  },

  acceptTeamInvitation: (invitationId) => {
    set((s) => ({
      invitations: s.invitations.map((inv) =>
        inv.id === invitationId ? { ...inv, status: "Aceptada" as const } : inv
      ),
    }));
    persistWorkspaceState(get());
  },

  cancelTeamInvitation: (invitationId) => {
    set((s) => ({
      invitations: s.invitations.filter((inv) => inv.id !== invitationId),
    }));
    persistWorkspaceState(get());
  },

  updateTeamMember: (memberId, patch) => {
    set((s) => ({
      team: s.team.map((m) => {
        if (m.id !== memberId) return m;
        const nextBrandIds = patch.brandIds ?? m.brandIds ?? [];
        return {
          ...m,
          ...patch,
          brandIds: nextBrandIds,
          brandsCount: patch.brandsCount ?? nextBrandIds.length,
        };
      }),
    }));
    persistWorkspaceState(get());
  },

  recordActivityEvent: (eventInput) => {
    set((s) => {
      const event = createActivityItem(s, eventInput);
      return {
        activityEvents: [event, ...s.activityEvents],
      };
    });
    persistWorkspaceState(get());
  },
});
