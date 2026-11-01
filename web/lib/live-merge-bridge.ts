import { CHAT_NOTIFICATION_PREFIX, chatRemote } from "./chat-live";
import { onLiveMerge } from "./live-workspace";
import { useHublyStore } from "./store";

// Se unieron cambios de otra persona: la pantalla los recoge. Lo del chat vive en sus tablas y no se toca.
onLiveMerge((data) => {
  const { channels, messages, chatScheduled, chatReminders, notifications, ...rest } = data;
  useHublyStore.setState((s) => ({
    ...rest,
    ...(chatRemote()
      ? { notifications: [...s.notifications.filter((n) => n.id.startsWith(CHAT_NOTIFICATION_PREFIX)), ...notifications] }
      : { channels, messages, chatScheduled, chatReminders, notifications }),
  }));
});
