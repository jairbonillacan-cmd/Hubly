// Notificaciones, archivos, proyectos y chat.
import type { StoreApi } from "zustand";
import { moveInList } from "../use-kanban-drag";
import type { HublyStoreState } from "../store";
import { persistWorkspaceState } from "./helpers";

type Set = StoreApi<HublyStoreState>["setState"];
type Get = StoreApi<HublyStoreState>["getState"];

export const createWorkspaceSlice = (set: Set, get: Get): Pick<
  HublyStoreState,
  | "markNotificationRead"
  | "markAllNotificationsRead"
  | "addNotification"
  | "addAsset"
  | "addProject"
  | "updateProject"
  | "deleteProject"
  | "moveProject"
  | "sendChatMessage"
> => ({
  markNotificationRead: (notificationId) => {
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    }));
    persistWorkspaceState(get());
  },

  markAllNotificationsRead: () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }));
    persistWorkspaceState(get());
  },

  addNotification: (notificationInput) => {
    set((s) => ({
      notifications: [
        {
          ...notificationInput,
          id: `notif-${Date.now()}`,
          read: false,
          createdAt: "Ahora mismo",
        },
        ...s.notifications,
      ],
    }));
    persistWorkspaceState(get());
  },

  addAsset: (assetInput) => {
    set((s) => ({
      assets: [
        {
          ...assetInput,
          id: `asset-${Date.now()}`,
          uploadedAt: "Ahora mismo",
          usedInPosts: 0,
        },
        ...s.assets,
      ],
    }));
    persistWorkspaceState(get());
  },

  addProject: (projInput) => {
    set((s) => ({
      projects: [{ ...projInput, id: `proj-${Date.now()}` }, ...s.projects],
    }));
    persistWorkspaceState(get());
  },

  updateProject: (projectId, patch) => {
    set((s) => ({ projects: s.projects.map((p) => (p.id === projectId ? { ...p, ...patch } : p)) }));
    persistWorkspaceState(get());
  },

  deleteProject: (projectId) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId) }));
    persistWorkspaceState(get());
  },

  moveProject: (projectId, status, beforeId) => {
    set((s) => ({
      projects: moveInList(s.projects, projectId, beforeId, (p) => ({ ...p, status })),
    }));
    persistWorkspaceState(get());
  },

  sendChatMessage: (channelId, text, sender = "Jair Bonilla", senderInitials = "JB") => {
    if (!text.trim()) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: `msg-${Date.now()}`,
          channelId,
          sender,
          senderInitials,
          text: text.trim(),
          time,
        },
      ],
    }));
    persistWorkspaceState(get());
  },
});
