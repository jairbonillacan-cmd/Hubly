import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  directKey,
  isMissingTable,
  mentionsName,
  messageToRow,
  rowToChannel,
  rowToMessage,
  rowToReminder,
  rowToNotification,
  rowToScheduled,
  unreadCount,
  type ChannelRow,
  type MessageRow,
  type NotificationRow,
  type PreferenceRow,
  type ReactionRow,
  type ReminderRow,
  type ScheduledRow,
} from "@/lib/chat-rows";
import { toggleReaction } from "@/lib/chat";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { ChatChannel, ChatMessage, ChatReminder, ChatScheduledMessage, WorkspaceNotification } from "@/lib/types";

export const CHAT_NOTIFICATION_PREFIX = "chat-mencion-";
const PAGE_SIZE = 50;
const UNREAD_CAP = 100;
const TYPING_MS = 4000;
const TYPING_SEND_MS = 2000;

/** Lo que cambia sin pasar por el documento: quién está en línea y quién escribe. */
export const useChatPresence = create<{
  online: string[];
  typing: Record<string, { name: string; until: number }>;
  /** Canales con mensajes más antiguos por pedir. */
  hasOlder: Record<string, boolean>;
  /** Ya hay conexión con las tablas: se puede buscar y escribir en ellas. */
  ready: boolean;
  /** La migración 0009 está aplicada: avisos, viendo y bots con eventos viven en el servidor. */
  serverFeatures: boolean;
  /** Chat abierto en esta pestaña: lo que llega ahí ya se está viendo y no se avisa. */
  viewing: string | null;
}>(() => ({ online: [], typing: {}, hasOlder: {}, ready: false, serverFeatures: false, viewing: null }));

export interface ChatBot {
  id: string;
  name: string;
  events_url?: string | null;
  events?: string[];
}

interface ChatState {
  channels: ChatChannel[];
  messages: ChatMessage[];
  chatScheduled?: ChatScheduledMessage[];
  chatReminders?: ChatReminder[];
  team: { id: string; name: string }[];
  notifications: WorkspaceNotification[];
  brands: { id: string; name: string }[];
  profile?: { id: string; name: string; avatarUrl?: string } | null;
}

interface ChatLiveInput {
  agencyId: string;
  get: () => ChatState;
  set: (patch: (s: ChatState) => Partial<ChatState>) => void;
}

export interface ChatRemote {
  sendMessage: (m: ChatMessage) => void;
  editMessage: (id: string, text: string) => void;
  deleteMessage: (id: string) => void;
  react: (messageId: string, emoji: string, on: boolean, who: string) => void;
  pin: (messageId: string, value: boolean) => void;
  markRead: (channelId: string) => void;
  setPreference: (channelId: string, patch: { muted?: boolean; pinned?: boolean; hidden?: boolean }) => void;
  addChannel: (c: ChatChannel) => void;
  updateChannel: (id: string, patch: { name?: string; description?: string; archived?: boolean; emoji?: string; memberIds?: string[] }) => void;
  loadOlder: (channelId: string) => Promise<void>;
  search: (query: string) => Promise<ChatMessage[]>;
  flushDue: () => void;
  listBots: (channelId: string) => Promise<ChatBot[]>;
  createBot: (channelId: string, name: string) => Promise<string | null>;
  deleteBot: (id: string) => Promise<void>;
  configureBot: (id: string, url: string, events: string[]) => Promise<string | null>;
  pressButton: (messageId: string, buttonId: string) => Promise<string | null>;
  markNotificationRead: (id: string) => void;
  setViewing: (channelId: string, viewing: boolean) => void;
  deleteChannel: (id: string) => void;
  schedule: (q: ChatScheduledMessage) => void;
  cancelScheduled: (id: string) => void;
  addReminder: (r: ChatReminder) => void;
  removeReminder: (id: string) => void;
  typing: (channelId: string) => void;
  stop: () => void;
}

let remote: ChatRemote | null = null;
export const chatRemote = () => remote;

/** Genera ids válidos para las tablas; el modo demo sigue con los suyos. */
export const newChatId = () => crypto.randomUUID();

function failed() {
  window.dispatchEvent(new CustomEvent("hubly:save-state", { detail: "error" }));
}

async function ensureChannels(db: SupabaseClient, agencyId: string, me: string, input: ChatLiveInput) {
  const brands = input.get().brands;
  const rows = [
    { agency_id: agencyId, kind: "general", name: "General", unique_key: "general", member_ids: [] as string[] },
    { agency_id: agencyId, kind: "self", name: "Notas", unique_key: `self:${me}`, member_ids: [me] },
    ...brands.map((b) => ({ agency_id: agencyId, kind: "brand", name: b.name, brand_id: b.id, unique_key: `brand:${b.id}`, member_ids: [] as string[] })),
  ];
  return db.from("chat_channels").upsert(rows, { onConflict: "agency_id,unique_key", ignoreDuplicates: true });
}

/** Primer arranque con tablas: lleva al chat nuevo lo que ya estaba en el documento. */
async function importFromDocument(db: SupabaseClient, agencyId: string, me: string, channels: ChannelRow[], doc: ChatMessage[], docChannels: ChatChannel[]) {
  if (doc.length === 0) return;
  const target = (channelId: string) => {
    const old = docChannels.find((c) => c.id === channelId);
    if (old?.brandId) return channels.find((c) => c.brand_id === old.brandId);
    if (channelId === "ch-general") return channels.find((c) => c.kind === "general");
    if (channelId === "dm-self") return channels.find((c) => c.kind === "self");
    return undefined;
  };
  const ids = new Map(doc.map((m) => [m.id, crypto.randomUUID()]));
  const rows = doc.flatMap((m) => {
    const channel = target(m.channelId);
    if (!channel) return [];
    return [{
      ...messageToRow({ ...m, id: ids.get(m.id)!, channelId: channel.id, parentId: m.parentId ? ids.get(m.parentId) : undefined }, agencyId, me),
      created_at: new Date(m.createdAt ?? Date.now()).toISOString(),
    }];
  });
  if (rows.length > 0) await db.from("chat_messages").insert(rows);
}

/** Completa una página de mensajes raíz con sus respuestas y reacciones. */
async function withThreads(db: SupabaseClient, roots: MessageRow[]) {
  const replies: MessageRow[] = [];
  const rootIds = roots.map((m) => m.id);
  for (let i = 0; i < rootIds.length; i += 200) {
    const { data } = await db.from("chat_messages").select("*").in("parent_id", rootIds.slice(i, i + 200)).order("created_at");
    replies.push(...((data ?? []) as MessageRow[]));
  }
  const all = [...roots, ...replies];
  const ids = all.map((m) => m.id);
  const reactions: ReactionRow[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await db.from("chat_reactions").select("*").in("message_id", ids.slice(i, i + 200));
    reactions.push(...((data ?? []) as ReactionRow[]));
  }
  return all.map((m) => rowToMessage(m, reactions.filter((r) => r.message_id === m.id)));
}

const pageOf = (db: SupabaseClient, channelId: string) =>
  db.from("chat_messages").select("*").eq("channel_id", channelId).is("parent_id", null).order("created_at", { ascending: false }).limit(PAGE_SIZE);

const byTime = (a: ChatMessage, b: ChatMessage) => (a.createdAt ?? 0) - (b.createdAt ?? 0);

async function loadChannels(db: SupabaseClient, agencyId: string, me: string, input: ChatLiveInput) {
  const [channels, prefs] = await Promise.all([
    db.from("chat_channels").select("*").eq("agency_id", agencyId),
    db.from("chat_preferences").select("*"),
  ]);
  if (channels.error || prefs.error) return { error: channels.error || prefs.error, rows: [] as ChannelRow[] };
  const { team, profile } = input.get();
  const prefRows = (prefs.data ?? []) as PreferenceRow[];
  const rows = (channels.data ?? []) as ChannelRow[];
  const mapped = await Promise.all(
    rows.map(async (row) => {
      const pref = prefRows.find((p) => p.channel_id === row.id);
      let unreadQuery = db.from("chat_messages").select("*").eq("channel_id", row.id).is("parent_id", null).neq("user_id", me).limit(UNREAD_CAP);
      if (pref?.last_read_at) unreadQuery = unreadQuery.gt("created_at", pref.last_read_at);
      const { data } = await unreadQuery;
      const unread = (data ?? []) as MessageRow[];
      return rowToChannel(row, me, team, pref, unreadCount(unread, row.id, me, pref?.last_read_at), unread.some((m) => mentionsName(m.text, profile?.name ?? "")));
    })
  );
  input.set(() => ({ channels: mapped }));
  return { error: null, rows };
}

async function load(db: SupabaseClient, agencyId: string, me: string, input: ChatLiveInput) {
  const { error, rows } = await loadChannels(db, agencyId, me, input);
  if (error) return error;
  const [scheduled, reminders] = await Promise.all([db.from("chat_scheduled").select("*"), db.from("chat_reminders").select("*")]);
  if (scheduled.error || reminders.error) return scheduled.error || reminders.error;
  const pages = await Promise.all(rows.map((row) => pageOf(db, row.id)));
  const hasOlder: Record<string, boolean> = {};
  rows.forEach((row, i) => (hasOlder[row.id] = (pages[i].data ?? []).length === PAGE_SIZE));
  const messages = await withThreads(db, pages.flatMap((p) => (p.data ?? []) as MessageRow[]));
  useChatPresence.setState({ hasOlder });
  input.set(() => ({
    messages: messages.sort(byTime),
    chatScheduled: ((scheduled.data ?? []) as ScheduledRow[]).map(rowToScheduled),
    chatReminders: ((reminders.data ?? []) as ReminderRow[]).map(rowToReminder),
  }));
  return null;
}

function subscribe(db: SupabaseClient, agencyId: string, me: string, input: ChatLiveInput, reload: () => void, reloadChannels: () => void): RealtimeChannel {
  const { get, set } = input;
  const nameOf = (id: string) => (id === me ? get().profile?.name : get().team.find((t) => t.id === id)?.name) ?? "";
  let subscribedOnce = false;
  const channel = db.channel(`chat:${agencyId}`, { config: { presence: { key: me } } });

  channel
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `agency_id=eq.${agencyId}` }, (e) => {
      const row = e.new as MessageRow;
      set((s) => {
        if (s.messages.some((m) => m.id === row.id)) return {};
        const fromOther = row.user_id !== me && !row.parent_id;
        const mentioned = fromOther && mentionsName(row.text, s.profile?.name ?? "");
        const watching = useChatPresence.getState().viewing === row.channel_id && document.visibilityState === "visible";
        return {
          // Personal: se queda en esta sesión y nunca entra al documento compartido.
          ...(mentioned && !watching && !useChatPresence.getState().serverFeatures
            ? {
                notifications: [
                  {
                    id: `${CHAT_NOTIFICATION_PREFIX}${row.id}`,
                    title: `${row.sender_name} te mencionó`,
                    body: row.text,
                    createdAt: row.created_at,
                    read: false,
                    kind: "comentario" as const,
                    actionUrl: `/chat?c=${encodeURIComponent(row.channel_id)}&m=${encodeURIComponent(row.id)}`,
                  },
                  ...s.notifications,
                ],
              }
            : {}),
          messages: [...s.messages, rowToMessage(row)],
          channels: fromOther
            ? s.channels.map((c) => (c.id === row.channel_id ? { ...c, unread: c.unread + 1, mentioned: c.mentioned || mentioned } : c))
            : s.channels,
        };
      });
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages", filter: `agency_id=eq.${agencyId}` }, (e) => {
      const row = e.new as MessageRow;
      set((s) => ({
        messages: s.messages.map((m) => (m.id === row.id ? { ...rowToMessage(row), reactions: m.reactions } : m)),
      }));
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (e) => {
      const id = (e.old as { id?: string }).id;
      if (id) set((s) => ({ messages: s.messages.filter((m) => m.id !== id && m.parentId !== id) }));
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_reactions", filter: `agency_id=eq.${agencyId}` }, (e) => {
      const row = e.new as ReactionRow;
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === row.message_id && !m.reactions?.[row.emoji]?.includes(row.user_name)
            ? { ...m, reactions: toggleReaction(m.reactions, row.emoji, row.user_name) }
            : m
        ),
      }));
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_reactions" }, (e) => {
      const row = e.old as Partial<ReactionRow>;
      const name = row.user_id ? nameOf(row.user_id) : "";
      if (!row.message_id || !row.emoji || !name) return;
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === row.message_id && m.reactions?.[row.emoji!]?.includes(name)
            ? { ...m, reactions: toggleReaction(m.reactions, row.emoji!, name) }
            : m
        ),
      }));
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "chat_channels", filter: `agency_id=eq.${agencyId}` }, () => reloadChannels())
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_channels" }, (e) => {
      const id = (e.old as { id?: string }).id;
      if (id) set((s) => ({ channels: s.channels.filter((c) => c.id !== id), messages: s.messages.filter((m) => m.channelId !== id) }));
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_notifications", filter: `user_id=eq.${me}` }, (e) => {
      const notification = rowToNotification(e.new as NotificationRow, CHAT_NOTIFICATION_PREFIX);
      set((s) => (s.notifications.some((n) => n.id === notification.id) ? {} : { notifications: [notification, ...s.notifications] }));
    })
    .on("presence", { event: "sync" }, () => {
      useChatPresence.setState({ online: Object.keys(channel.presenceState()) });
    })
    .on("broadcast", { event: "typing" }, ({ payload }) => {
      const { channelId, name, userId } = payload as { channelId: string; name: string; userId: string };
      if (userId === me) return;
      const until = Date.now() + TYPING_MS;
      useChatPresence.setState((s) => ({ typing: { ...s.typing, [channelId]: { name, until } } }));
      window.setTimeout(() => {
        useChatPresence.setState((s) => {
          if ((s.typing[channelId]?.until ?? 0) > Date.now()) return s;
          const { [channelId]: _gone, ...rest } = s.typing;
          return { typing: rest };
        });
      }, TYPING_MS + 50);
    })
    .subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      void channel.track({ at: Date.now() });
      // Al reconectar se recupera lo que llegó mientras tanto.
      if (subscribedOnce) reload();
      subscribedOnce = true;
    });
  return channel;
}

/** Devuelve false si las tablas aún no existen: entonces el chat sigue en el documento. */
export function startChatLive(input: ChatLiveInput): Promise<boolean> {
  // La sincronización del espacio corre más de una vez; el canal de Supabase solo admite una suscripción.
  if (starting?.agencyId === input.agencyId) return starting.done;
  remote?.stop();
  remote = null;
  const done = connect(input);
  starting = { agencyId: input.agencyId, done };
  return done;
}

let starting: { agencyId: string; done: Promise<boolean> } | null = null;

async function connect(input: ChatLiveInput): Promise<boolean> {
  const { agencyId, get, set } = input;
  const me = get().profile?.id;
  if (!me) return false;
  const db = createSupabaseBrowser();

  const probe = await db.from("chat_channels").select("id").eq("agency_id", agencyId).limit(1);
  if (probe.error) {
    if (!isMissingTable(probe.error)) failed();
    return false;
  }
  const docMessages = get().messages;
  const docChannels = get().channels;
  const ensured = await ensureChannels(db, agencyId, me, input);
  if (ensured.error) {
    failed();
    return false;
  }
  const existing = await db.from("chat_messages").select("id").eq("agency_id", agencyId).limit(1);
  if (!existing.error && (existing.data ?? []).length === 0) {
    const { data } = await db.from("chat_channels").select("*").eq("agency_id", agencyId);
    await importFromDocument(db, agencyId, me, (data ?? []) as ChannelRow[], docMessages, docChannels);
  }
  const loadError = await load(db, agencyId, me, input);
  if (loadError) {
    failed();
    return false;
  }

  const notices = await db.from("chat_notifications").select("*").is("read_at", null).order("created_at", { ascending: false }).limit(50);
  if (!notices.error) {
    useChatPresence.setState({ serverFeatures: true });
    const rows = (notices.data ?? []) as NotificationRow[];
    set((s) => ({
      notifications: [...rows.map((r) => rowToNotification(r, CHAT_NOTIFICATION_PREFIX)), ...s.notifications.filter((n) => !n.id.startsWith(CHAT_NOTIFICATION_PREFIX))],
    }));
  }
  const reload = () => void load(db, agencyId, me, input);
  const channel = subscribe(db, agencyId, me, input, reload, () => void loadChannels(db, agencyId, me, input));
  // En orden: un mensaje o una lectura no pueden adelantarse a la creación de su canal.
  let writes: Promise<void> = Promise.resolve();
  const check = (query: PromiseLike<{ error: unknown }>) => {
    writes = writes.then(async () => {
      const { error } = await query;
      if (error) {
        failed();
        reload(); // Lo que el servidor no aceptó no debe quedarse en pantalla.
      }
    });
  };
  let lastTyping = 0;

  remote = {
    sendMessage: (m) => {
      check(db.from("chat_messages").insert(messageToRow(m, agencyId, me)));
      // Tras guardarlo: el servidor avisa a los bots del canal.
      if (useChatPresence.getState().serverFeatures) {
        // Sin esperar la respuesta: un bot lento no debe frenar los mensajes siguientes.
        writes = writes.then(() => {
          void fetch("/api/chat/events", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: m.id }) }).catch(() => {});
        });
      }
    },
    editMessage: (id, text) => void check(db.from("chat_messages").update({ text, edited_at: new Date().toISOString() }).eq("id", id)),
    deleteMessage: (id) => void check(db.from("chat_messages").delete().eq("id", id)),
    react: (messageId, emoji, on, who) =>
      void check(
        on
          ? db.from("chat_reactions").insert({ message_id: messageId, agency_id: agencyId, user_name: who, emoji })
          : db.from("chat_reactions").delete().match({ message_id: messageId, user_id: me, emoji })
      ),
    pin: (messageId, value) => void check(db.rpc("chat_set_pinned", { target_message: messageId, value })),
    markRead: (channelId) =>
      void check(db.from("chat_preferences").upsert({ channel_id: channelId, user_id: me, last_read_at: new Date().toISOString() }, { onConflict: "channel_id,user_id" })),
    setPreference: (channelId, patch) =>
      void check(db.from("chat_preferences").upsert({ channel_id: channelId, user_id: me, ...patch }, { onConflict: "channel_id,user_id" })),
    addChannel: (c) =>
      void check(
        db.from("chat_channels").insert({
          id: c.id,
          agency_id: agencyId,
          kind: c.type,
          name: c.name,
          description: c.description ?? "",
          unique_key: c.memberId ? directKey(me, c.memberId) : null,
          member_ids: c.memberId ? [me, c.memberId] : [],
        })
      ),
    updateChannel: (id, patch) =>
      void check(
        db.from("chat_channels").update({
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.description !== undefined ? { description: patch.description } : {}),
          ...(patch.archived !== undefined ? { is_archived: patch.archived } : {}),
          ...(patch.emoji !== undefined ? { emoji: patch.emoji } : {}),
          ...(patch.memberIds !== undefined ? { member_ids: patch.memberIds } : {}),
        }).eq("id", id)
      ),
    deleteChannel: (id) => void check(db.from("chat_channels").delete().eq("id", id)),
    schedule: (q) => void check(db.from("chat_scheduled").insert({ id: q.id, channel_id: q.channelId, sender_name: q.sender, sender_initials: q.senderInitials.slice(0, 4), sender_avatar: get().profile?.avatarUrl ?? null, text: q.text, send_at: new Date(q.sendAt).toISOString(), repeat: q.repeat })),
    cancelScheduled: (id) => void check(db.from("chat_scheduled").delete().eq("id", id)),
    addReminder: (r) => void check(db.from("chat_reminders").insert({ id: r.id, channel_id: r.channelId, message_id: r.messageId, text: r.text, remind_at: new Date(r.remindAt).toISOString() })),
    removeReminder: (id) => void check(db.from("chat_reminders").delete().eq("id", id)),
    loadOlder: async (channelId) => {
      const oldest = get().messages.filter((m) => m.channelId === channelId && !m.parentId).sort(byTime)[0];
      let query = pageOf(db, channelId);
      if (oldest?.createdAt) query = query.lt("created_at", new Date(oldest.createdAt).toISOString());
      const { data, error } = await query;
      if (error) return failed();
      const rows = (data ?? []) as MessageRow[];
      const older = await withThreads(db, rows);
      set((s) => {
        const known = new Set(s.messages.map((m) => m.id));
        return { messages: [...older.filter((m) => !known.has(m.id)), ...s.messages].sort(byTime) };
      });
      useChatPresence.setState((s) => ({ hasOlder: { ...s.hasOlder, [channelId]: rows.length === PAGE_SIZE } }));
    },
    search: async (query) => {
      const pattern = `%${query.replace(/[%_]/g, "")}%`;
      const { data, error } = await db.from("chat_messages").select("*").eq("agency_id", agencyId).ilike("text", pattern).order("created_at", { ascending: false }).limit(20);
      return error ? [] : ((data ?? []) as MessageRow[]).map((m) => rowToMessage(m));
    },
    flushDue: () => {
      void db.rpc("chat_flush_due").then(async ({ error }) => {
        if (error) return failed();
        const { data } = await db.from("chat_scheduled").select("*");
        set(() => ({ chatScheduled: ((data ?? []) as ScheduledRow[]).map(rowToScheduled) }));
      });
    },
    listBots: async (channelId) => {
      const { data } = await db
        .from("chat_bots")
        .select(useChatPresence.getState().serverFeatures ? "id, name, events_url, events" : "id, name")
        .eq("channel_id", channelId);
      return (data ?? []) as unknown as ChatBot[];
    },
    createBot: async (channelId, name) => {
      const { data, error } = await db.rpc("chat_create_bot", { target_channel: channelId, bot_name: name });
      return error ? null : (data as string);
    },
    deleteBot: async (id) => {
      const { error } = await db.from("chat_bots").delete().eq("id", id);
      if (error) failed();
    },
    configureBot: async (id, url, events) => {
      const { data, error } = await db.rpc("chat_configure_bot", { target_bot: id, url, wanted: events });
      return error ? null : (data as string);
    },
    pressButton: async (messageId, buttonId) => {
      try {
        const res = await fetch("/api/chat/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId, buttonId }) });
        if (res.ok) return null;
        return ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "El bot no respondió";
      } catch {
        return "No pudimos enviar. Revisa tu conexión.";
      }
    },
    markNotificationRead: (id) => {
      check(db.from("chat_notifications").update({ read_at: new Date().toISOString() }).eq("id", id.slice(CHAT_NOTIFICATION_PREFIX.length)));
    },
    setViewing: (channelId, viewing) => {
      if (!useChatPresence.getState().serverFeatures) return;
      check(db.from("chat_preferences").upsert({ channel_id: channelId, user_id: me, viewing_at: viewing ? new Date().toISOString() : null }, { onConflict: "channel_id,user_id" }));
    },
    typing: (channelId) => {
      if (Date.now() - lastTyping < TYPING_SEND_MS) return;
      lastTyping = Date.now();
      void channel.send({ type: "broadcast", event: "typing", payload: { channelId, name: get().profile?.name ?? "", userId: me } });
    },
    stop: () => void db.removeChannel(channel),
  };
  useChatPresence.setState({ ready: true });
  return true;
}
