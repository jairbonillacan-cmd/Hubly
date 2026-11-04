import type { StateCreator } from "zustand";
import { CHAT_NOTIFICATION_PREFIX, chatRemote, useChatPresence } from "../chat-live";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { WorkspaceNotification } from "../types";

export interface NotificationsSlice {
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (
    notification: Omit<WorkspaceNotification, "id" | "createdAt" | "read">
  ) => void;
}

export const createNotificationsSlice: StateCreator<HublyStoreState, [], [], NotificationsSlice> = (set, get) => ({
  markNotificationRead: (notificationId) => {
    if (notificationId.startsWith(CHAT_NOTIFICATION_PREFIX) && useChatPresence.getState().serverFeatures) chatRemote()?.markNotificationRead(notificationId);
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
});
