import { create } from "zustand";
import { localIsoDate } from "@/lib/date";
import { adoptLegacyKey } from "@/lib/account-scoped-storage";

export const DELETE_UNDO_MS = 10_000;
export const NEW_CHAT_TITLE = "Nueva conversación";

export interface HubiTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  actionType?: "open_composer" | "open_suggestions" | "open_invite";
  actionLabel?: string;
}

export interface HubiChat {
  id: string;
  title: string;
  updatedAt: number;
  turns: HubiTurn[];
}

export interface DeletedChat {
  chat: HubiChat;
  expiresAt: number;
}

interface HubiChatsState {
  scope: string | null;
  chats: HubiChat[];
  activeChatId: string | null;
  fullView: boolean;
  deleted: DeletedChat[];
  loadChats: (scope: string) => void;
  startChat: () => void;
  openChat: (id: string) => void;
  appendTurns: (turns: HubiTurn[]) => void;
  setFullView: (fullView: boolean) => void;
  deleteChat: (id: string) => void;
  restoreChat: (id: string) => void;
}

const storageKey = (scope: string) => `hubly:chats-hubi:${scope}`;
const expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();

function createChat(): HubiChat {
  return { id: crypto.randomUUID(), title: NEW_CHAT_TITLE, updatedAt: Date.now(), turns: [] };
}

function readChats(scope: string): HubiChat[] {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(scope)) ?? "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeChats(scope: string | null, chats: HubiChat[]) {
  if (!scope) return;
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify(chats));
  } catch {
    // Sin almacenamiento la conversación sigue viva hasta recargar.
  }
}

export function chatTitleFrom(text: string): string {
  return text.trim().replace(/\s+/g, " ").slice(0, 80) || NEW_CHAT_TITLE;
}

export function chatTimeLabel(updatedAt: number, now = new Date()): string {
  const date = new Date(updatedAt);
  if (localIsoDate(date) === localIsoDate(now)) {
    return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "");
}

export function sortChats(chats: HubiChat[]): HubiChat[] {
  return [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
}

export const useHubiChats = create<HubiChatsState>((set, get) => {
  const commit = (chats: HubiChat[], patch: Partial<HubiChatsState> = {}) => {
    writeChats(get().scope, chats);
    set({ chats, ...patch });
  };

  return {
    scope: null,
    chats: [],
    activeChatId: null,
    fullView: false,
    deleted: [],

    loadChats: (scope) => {
      if (get().scope === scope) return;
      expiryTimers.forEach(clearTimeout);
      expiryTimers.clear();
      // El scope es "agencia:cuenta". Si queda la clave antigua (solo agencia), se adopta
      // para esa cuenta y se borra: así la conversación no se pierde ni queda legible por otra cuenta.
      const sep = scope.indexOf(":");
      if (sep > 0 && typeof localStorage !== "undefined") {
        adoptLegacyKey(storageKey(scope.slice(0, sep)), storageKey(scope), localStorage);
      }
      set({ scope, chats: readChats(scope), activeChatId: null, deleted: [] });
    },

    startChat: () => {
      const { chats } = get();
      const empty = chats.find((chat) => chat.turns.length === 0);
      if (empty) {
        set({ activeChatId: empty.id, fullView: true });
        return;
      }
      const chat = createChat();
      commit([chat, ...chats], { activeChatId: chat.id, fullView: true });
    },

    openChat: (id) => set({ activeChatId: id, fullView: true }),

    appendTurns: (turns) => {
      const { chats, activeChatId } = get();
      const current = chats.find((chat) => chat.id === activeChatId) ?? createChat();
      const firstUserTurn = turns.find((turn) => turn.role === "user");
      const updated: HubiChat = {
        ...current,
        title: current.turns.length === 0 && firstUserTurn ? chatTitleFrom(firstUserTurn.text) : current.title,
        updatedAt: Date.now(),
        turns: [...current.turns, ...turns],
      };
      commit([updated, ...chats.filter((chat) => chat.id !== current.id)], { activeChatId: updated.id });
    },

    setFullView: (fullView) => set({ fullView }),

    deleteChat: (id) => {
      const { chats, activeChatId, deleted } = get();
      const chat = chats.find((item) => item.id === id);
      if (!chat) return;
      commit(chats.filter((item) => item.id !== id), {
        activeChatId: activeChatId === id ? null : activeChatId,
        deleted: [...deleted, { chat, expiresAt: Date.now() + DELETE_UNDO_MS }],
      });
      expiryTimers.set(
        id,
        setTimeout(() => {
          expiryTimers.delete(id);
          set({ deleted: get().deleted.filter((item) => item.chat.id !== id) });
        }, DELETE_UNDO_MS)
      );
    },

    restoreChat: (id) => {
      const { chats, deleted } = get();
      const entry = deleted.find((item) => item.chat.id === id);
      if (!entry) return;
      clearTimeout(expiryTimers.get(id));
      expiryTimers.delete(id);
      commit(sortChats([...chats, entry.chat]), {
        deleted: deleted.filter((item) => item.chat.id !== id),
      });
    },
  };
});
