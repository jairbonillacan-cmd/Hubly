// Equipo, actividad, widgets del tablero y onboarding.
import type { StoreApi } from "zustand";
import { DEFAULT_WIDGETS_CONFIG } from "../seed-data";
import type { DashboardWidgetConfig, DashboardWidgetId, TeamInvitation, TeamMember } from "../types";
import type { HublyStoreState } from "../store";
import { persistWorkspaceState, createActivityItem } from "./helpers";

type Set = StoreApi<HublyStoreState>["setState"];
type Get = StoreApi<HublyStoreState>["getState"];

export const createTeamSlice = (set: Set, get: Get): Pick<
  HublyStoreState,
  | "inviteTeamMember"
  | "acceptTeamInvitation"
  | "cancelTeamInvitation"
  | "updateTeamMember"
  | "recordActivityEvent"
  | "toggleWidgetVisibility"
  | "setWidgetVisibility"
  | "reorderWidgets"
  | "moveWidget"
  | "setWidgetSpan"
  | "resetWidgetsLayout"
  | "toggleOnboardingStep"
  | "setOnboardingDismissed"
  | "setOnboardingMinimized"
> => ({
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

  toggleWidgetVisibility: (widgetId) => {
    set((s) => ({
      widgets: s.widgets.map((w) =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      ),
    }));
    persistWorkspaceState(get());
  },

  setWidgetVisibility: (widgetId, visible) => {
    set((s) => ({
      widgets: s.widgets.map((w) =>
        w.id === widgetId ? { ...w, visible } : w
      ),
    }));
    persistWorkspaceState(get());
  },

  reorderWidgets: (orderedIds) => {
    set((s) => {
      const byId = new Map<DashboardWidgetId, DashboardWidgetConfig>(
        s.widgets.map((w) => [w.id, w])
      );
      const reordered: DashboardWidgetConfig[] = [];
      orderedIds.forEach((id, idx) => {
        const found = byId.get(id);
        if (found) {
          reordered.push({ ...found, order: idx + 1 });
          byId.delete(id);
        }
      });
      byId.forEach((remaining) => {
        reordered.push({ ...remaining, order: reordered.length + 1 });
      });
      return {
        widgets: reordered,
      };
    });
    persistWorkspaceState(get());
  },

  moveWidget: (widgetId, direction) => {
    set((s) => {
      const sorted = [...s.widgets].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((w) => w.id === widgetId);
      if (index === -1) return s;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return s;

      const temp = sorted[index];
      sorted[index] = sorted[targetIndex];
      sorted[targetIndex] = temp;

      const normalized = sorted.map((w, idx) => ({ ...w, order: idx + 1 }));
      return {
        widgets: normalized,
      };
    });
    persistWorkspaceState(get());
  },

  setWidgetSpan: (widgetId, span) => {
    set((s) => ({
      widgets: s.widgets.map((w) => (w.id === widgetId ? { ...w, span } : w)),
    }));
    persistWorkspaceState(get());
  },

  resetWidgetsLayout: () => {
    set({
      widgets: DEFAULT_WIDGETS_CONFIG.map((w) => ({ ...w })),
    });
    persistWorkspaceState(get());
  },

  toggleOnboardingStep: (stepKey, forceValue) => {
    set((s) => {
      const prevOverrides = s.onboarding.manualOverrides || {};
      const currentVal = Boolean(prevOverrides[stepKey]);
      const nextVal = forceValue !== undefined ? forceValue : !currentVal;
      return {
        onboarding: {
          ...s.onboarding,
          manualOverrides: {
            ...prevOverrides,
            [stepKey]: nextVal,
          },
        },
      };
    });
    persistWorkspaceState(get());
  },

  setOnboardingDismissed: (dismissed) => {
    set((s) => ({
      onboarding: {
        ...s.onboarding,
        dismissed,
      },
    }));
    persistWorkspaceState(get());
  },

  setOnboardingMinimized: (minimized) => {
    set((s) => ({
      onboarding: {
        ...s.onboarding,
        minimized,
      },
    }));
    persistWorkspaceState(get());
  },
});
