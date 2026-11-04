import type { StateCreator } from "zustand";
import { nextOccurrence, toggleReaction } from "../chat";
import { chatRemote, newChatId, useChatPresence } from "../chat-live";
import { persistWorkspaceState } from "./sync";
import type { HublyStoreState } from "../store";
import type { ChatAttachment, ChatChannel, ChatMessage, ChatReminder, ChatScheduledMessage } from "../types";

export interface ChatSlice {
  sendChatMessage: (
    channelId: string,
    text: string,
    sender?: string,
    senderInitials?: string,
    options?: { parentId?: string; attachment?: ChatAttachment }
  ) => void;
  editChatMessage: (messageId: string, text: string) => void;
  /** Borra el mensaje y sus respuestas. */
  deleteChatMessage: (messageId: string) => void;
  toggleChatReaction: (messageId: string, emoji: string, who: string) => void;
  toggleChatPin: (messageId: string) => void;
  markChatRead: (channelId: string) => void;
  addChatChannel: (input: Pick<ChatChannel, "name" | "type"> & Partial<ChatChannel>) => ChatChannel;
  updateChatChannel: (channelId: string, patch: Partial<Pick<ChatChannel, "name" | "description" | "archived" | "emoji" | "memberIds">>) => void;
  setChatPreference: (channelId: string, patch: Partial<Pick<ChatChannel, "muted" | "listPinned" | "hidden">>) => void;
  /** Borra el canal con sus mensajes y lo que tenía en cola. */
  deleteChatChannel: (channelId: string) => void;
  scheduleChatMessage: (input: Omit<ChatScheduledMessage, "id">) => void;
  cancelChatScheduled: (id: string) => void;
  addChatReminder: (input: Omit<ChatReminder, "id">) => void;
  /** Envía lo programado y avisa los recordatorios vencidos de esta persona. */
  flushChatQueue: (now: number) => void;
}

export const createChatSlice: StateCreator<HublyStoreState, [], [], ChatSlice> = (set, get) => ({
  sendChatMessage: (channelId, text, sender = "Jair Bonilla", senderInitials = "JB", options) => {
    const body = text.trim();
    if (!body && !options?.attachment) return;
    const now = new Date();
    const remote = chatRemote();
    const message: ChatMessage = {
      id: remote ? newChatId() : `msg-${now.getTime()}-${get().messages.length}`,
      channelId,
      sender,
      senderInitials,
      text: body,
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      createdAt: now.getTime(),
      ...(remote && get().profile?.id ? { senderId: get().profile.id } : {}),
      ...(remote && get().profile?.avatarUrl ? { senderAvatar: get().profile.avatarUrl } : {}),
      ...(options?.parentId ? { parentId: options.parentId } : {}),
      ...(options?.attachment ? { attachment: options.attachment } : {}),
    };
    set((s) => ({ messages: [...s.messages, message] }));
    if (remote) remote.sendMessage(message);
    else persistWorkspaceState(get());
  },

  editChatMessage: (messageId, text) => {
    const body = text.trim();
    if (!body) return;
    set((s) => ({
      messages: s.messages.map((m) => (m.id === messageId ? { ...m, text: body, editedAt: Date.now() } : m)),
    }));
    chatRemote()?.editMessage(messageId, body);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  deleteChatMessage: (messageId) => {
    set((s) => ({ messages: s.messages.filter((m) => m.id !== messageId && m.parentId !== messageId) }));
    chatRemote()?.deleteMessage(messageId);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  toggleChatReaction: (messageId, emoji, who) => {
    const had = get().messages.find((m) => m.id === messageId)?.reactions?.[emoji]?.includes(who) ?? false;
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId ? { ...m, reactions: toggleReaction(m.reactions, emoji, who) } : m
      ),
    }));
    chatRemote()?.react(messageId, emoji, !had, who);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  toggleChatPin: (messageId) => {
    const pinned = !get().messages.find((m) => m.id === messageId)?.pinned;
    set((s) => ({
      messages: s.messages.map((m) => (m.id === messageId ? { ...m, pinned } : m)),
    }));
    chatRemote()?.pin(messageId, pinned);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  markChatRead: (channelId) => {
    chatRemote()?.markRead(channelId);
    if (!get().channels.some((c) => c.id === channelId && c.unread > 0)) return;
    set((s) => ({ channels: s.channels.map((c) => (c.id === channelId ? { ...c, unread: 0, mentioned: false } : c)) }));
    if (!chatRemote()) persistWorkspaceState(get());
  },

  addChatChannel: (input) => {
    const remote = chatRemote();
    const channel: ChatChannel = { unread: 0, ...input, id: remote ? newChatId() : `ch-${Date.now()}` };
    set((s) => ({ channels: [...s.channels, channel] }));
    if (remote) remote.addChannel(channel);
    else persistWorkspaceState(get());
    return channel;
  },

  updateChatChannel: (channelId, patch) => {
    set((s) => ({ channels: s.channels.map((c) => (c.id === channelId ? { ...c, ...patch } : c)) }));
    chatRemote()?.updateChannel(channelId, patch);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  setChatPreference: (channelId, patch) => {
    set((s) => ({ channels: s.channels.map((c) => (c.id === channelId ? { ...c, ...patch } : c)) }));
    chatRemote()?.setPreference(channelId, {
      ...(patch.muted !== undefined ? { muted: patch.muted } : {}),
      ...(patch.listPinned !== undefined ? { pinned: patch.listPinned } : {}),
      ...(patch.hidden !== undefined ? { hidden: patch.hidden } : {}),
    });
  },

  deleteChatChannel: (channelId) => {
    set((s) => ({
      channels: s.channels.filter((c) => c.id !== channelId),
      messages: s.messages.filter((m) => m.channelId !== channelId),
      chatScheduled: (s.chatScheduled || []).filter((q) => q.channelId !== channelId),
      chatReminders: (s.chatReminders || []).filter((r) => r.channelId !== channelId),
    }));
    chatRemote()?.deleteChannel(channelId);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  scheduleChatMessage: (input) => {
    const remote = chatRemote();
    const item = { ...input, id: remote ? newChatId() : `cola-${Date.now()}` };
    set((s) => ({ chatScheduled: [...(s.chatScheduled || []), item] }));
    if (remote) remote.schedule(item);
    else persistWorkspaceState(get());
  },

  cancelChatScheduled: (id) => {
    set((s) => ({ chatScheduled: (s.chatScheduled || []).filter((q) => q.id !== id) }));
    chatRemote()?.cancelScheduled(id);
    if (!chatRemote()) persistWorkspaceState(get());
  },

  addChatReminder: (input) => {
    const remote = chatRemote();
    const item = { ...input, id: remote ? newChatId() : `rec-${Date.now()}` };
    set((s) => ({ chatReminders: [...(s.chatReminders || []), item] }));
    if (remote) remote.addReminder(item);
    else persistWorkspaceState(get());
  },

  flushChatQueue: (now) => {
    const { profile, chatScheduled = [], chatReminders = [] } = get();
    const mine = <T extends { authorId: string }>(item: T) => item.authorId === profile?.id;
    const dueMessages = chatScheduled.filter((q) => mine(q) && q.sendAt <= now);
    const dueReminders = chatReminders.filter((r) => mine(r) && r.remindAt <= now);
    if (dueMessages.length === 0 && dueReminders.length === 0) return;
    const remote = chatRemote();
    // Con tablas, el servidor envía cada uno una sola vez aunque haya varias sesiones abiertas.
    // Con la 0009, los recordatorios también los resuelve el servidor y llegan como aviso propio.
    const serverReminders = Boolean(remote) && useChatPresence.getState().serverFeatures;
    if (remote && (dueMessages.length > 0 || (serverReminders && dueReminders.length > 0))) remote.flushDue();
    if (serverReminders && dueMessages.length === 0) {
      set((s) => ({ chatReminders: (s.chatReminders || []).filter((r) => !dueReminders.some((d) => d.id === r.id)) }));
      return;
    }
    if (!remote) for (const q of dueMessages) get().sendChatMessage(q.channelId, q.text, q.sender, q.senderInitials);
    for (const r of serverReminders ? [] : dueReminders) {
      get().addNotification({
        title: "Recordatorio del chat",
        body: r.text,
        kind: "sistema",
        actionUrl: `/chat?c=${encodeURIComponent(r.channelId)}&m=${encodeURIComponent(r.messageId)}`,
      });
    }
    const handled = new Set(dueMessages.map((q) => q.id));
    const remindedIds = new Set(dueReminders.map((r) => r.id));
    set((s) => ({
      chatScheduled: (s.chatScheduled || []).flatMap((q) => {
        if (!handled.has(q.id) || remote) return [q];
        return q.repeat === "none" ? [] : [{ ...q, sendAt: nextOccurrence(q.sendAt, q.repeat, now) }];
      }),
      chatReminders: (s.chatReminders || []).filter((r) => !remindedIds.has(r.id)),
    }));
    if (remote) {
      if (!serverReminders) for (const r of dueReminders) remote.removeReminder(r.id);
    }
    else persistWorkspaceState(get());
  },
});
