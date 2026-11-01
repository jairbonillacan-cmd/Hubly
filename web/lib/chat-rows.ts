import { timeLabel } from "@/lib/chat";
import type { ChatAttachment, ChatChannel, ChatMessage, ChatReminder, ChatScheduledMessage, WorkspaceNotification } from "@/lib/types";

export interface ChannelRow {
  id: string;
  agency_id: string;
  kind: "general" | "agency" | "brand" | "direct" | "self";
  name: string;
  description: string;
  emoji: string;
  brand_id: string | null;
  unique_key: string | null;
  member_ids: string[];
  is_archived: boolean;
}

export interface MessageRow {
  id: string;
  channel_id: string;
  agency_id: string;
  user_id: string;
  bot_id?: string | null;
  buttons?: { id: string; texto: string; estilo?: string }[] | null;
  sender_name: string;
  sender_initials: string;
  sender_avatar: string | null;
  text: string;
  parent_id: string | null;
  attachment: ChatAttachment | null;
  pinned: boolean;
  edited_at: string | null;
  created_at: string;
}

export interface ReactionRow {
  message_id: string;
  user_id: string;
  user_name: string;
  emoji: string;
}

export interface PreferenceRow {
  channel_id: string;
  muted: boolean;
  pinned: boolean;
  hidden: boolean;
  last_read_at: string | null;
}

export interface ScheduledRow {
  id: string;
  channel_id: string;
  user_id: string;
  sender_name: string;
  sender_initials: string;
  text: string;
  send_at: string;
  repeat: ChatScheduledMessage["repeat"];
}

export interface ReminderRow {
  id: string;
  channel_id: string;
  message_id: string;
  user_id: string;
  text: string;
  remind_at: string;
}

interface Person {
  id: string;
  name: string;
}

export const directKey = (a: string, b: string) => `dm:${[a, b].sort().join(":")}`;

export function rowToMessage(row: MessageRow, reactions: ReactionRow[] = []): ChatMessage {
  const createdAt = new Date(row.created_at).getTime();
  const grouped: Record<string, string[]> = {};
  for (const r of reactions) (grouped[r.emoji] ??= []).push(r.user_name);
  return {
    id: row.id,
    channelId: row.channel_id,
    sender: row.sender_name,
    senderInitials: row.sender_initials,
    senderId: row.user_id,
    senderAvatar: row.sender_avatar ?? undefined,
    ...(row.bot_id ? { isBot: true } : {}),
    ...(row.buttons?.length ? { botButtons: row.buttons } : {}),
    text: row.text,
    time: timeLabel(new Date(createdAt)),
    createdAt,
    ...(row.parent_id ? { parentId: row.parent_id } : {}),
    ...(row.edited_at ? { editedAt: new Date(row.edited_at).getTime() } : {}),
    ...(row.pinned ? { pinned: true } : {}),
    ...(reactions.length ? { reactions: grouped } : {}),
    ...(row.attachment ? { attachment: row.attachment } : {}),
  };
}

export function messageToRow(m: ChatMessage, agencyId: string, userId: string) {
  return {
    id: m.id,
    channel_id: m.channelId,
    agency_id: agencyId,
    user_id: userId,
    sender_name: m.sender,
    sender_initials: m.senderInitials.slice(0, 4),
    sender_avatar: m.senderAvatar ?? null,
    text: m.text,
    parent_id: m.parentId ?? null,
    attachment: m.attachment ?? null,
  };
}

/** Sin leer: mensajes de otros, fuera de hilos, posteriores a la última lectura. */
export function unreadCount(messages: MessageRow[], channelId: string, me: string, lastReadAt: string | null | undefined): number {
  const since = lastReadAt ? new Date(lastReadAt).getTime() : 0;
  return messages.filter(
    (m) => m.channel_id === channelId && m.user_id !== me && !m.parent_id && new Date(m.created_at).getTime() > since
  ).length;
}

/** Un mensaje directo se llama como la otra persona, según quién lo mire. */
export function rowToChannel(row: ChannelRow, me: string, team: Person[], pref: PreferenceRow | undefined, unread: number, mentioned = false): ChatChannel {
  const other = row.kind === "direct" ? row.member_ids.find((id) => id !== me) : undefined;
  return {
    id: row.id,
    name: (other && team.find((t) => t.id === other)?.name) || row.name,
    type: row.kind,
    unread,
    ...(row.brand_id ? { brandId: row.brand_id } : {}),
    ...(row.description ? { description: row.description } : {}),
    ...(other ? { memberId: other } : {}),
    ...(row.is_archived ? { archived: true } : {}),
    ...(row.emoji ? { emoji: row.emoji } : {}),
    ...(row.kind === "agency" && row.member_ids.length ? { memberIds: row.member_ids } : {}),
    ...(mentioned ? { mentioned: true } : {}),
    muted: pref?.muted ?? false,
    listPinned: pref?.pinned ?? false,
    hidden: pref?.hidden ?? false,
  };
}

export interface NotificationRow {
  id: string;
  message_id: string | null;
  channel_id: string | null;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export function rowToNotification(row: NotificationRow, prefix: string): WorkspaceNotification {
  return {
    id: `${prefix}${row.id}`,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    read: Boolean(row.read_at),
    kind: "comentario",
    ...(row.channel_id ? { actionUrl: `/chat?c=${encodeURIComponent(row.channel_id)}${row.message_id ? `&m=${encodeURIComponent(row.message_id)}` : ""}` } : {}),
  };
}

/** Solo botones bien formados y como máximo cinco: los manda un sistema externo. */
export function cleanButtons(raw: unknown): { id: string; texto: string; estilo: string }[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: { id: string; texto: string; estilo: string }[] = [];
  for (const item of raw) {
    const id = typeof item?.id === "string" ? item.id.trim().slice(0, 40) : "";
    const texto = typeof item?.texto === "string" ? item.texto.trim().slice(0, 40) : "";
    if (!/^[a-zA-Z0-9_.:-]+$/.test(id) || !texto || seen.has(id) || out.length >= 5) continue;
    seen.add(id);
    out.push({ id, texto, estilo: item.estilo === "principal" || item.estilo === "peligro" ? item.estilo : "normal" });
  }
  return out;
}

export const mentionsName = (text: string, name: string) =>
  Boolean(name) && new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "iu").test(text);

export function rowToScheduled(row: ScheduledRow): ChatScheduledMessage {
  return {
    id: row.id,
    channelId: row.channel_id,
    text: row.text,
    sendAt: new Date(row.send_at).getTime(),
    repeat: row.repeat,
    authorId: row.user_id,
    sender: row.sender_name,
    senderInitials: row.sender_initials,
  };
}

export function rowToReminder(row: ReminderRow): ChatReminder {
  return {
    id: row.id,
    channelId: row.channel_id,
    messageId: row.message_id,
    text: row.text,
    remindAt: new Date(row.remind_at).getTime(),
    authorId: row.user_id,
  };
}

/** La migración aún no se aplica: el chat sigue en el documento del espacio. */
export function isMissingTable(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return error.code === "42P01" || error.code === "PGRST205" || /could not find the table|does not exist/i.test(error.message ?? "");
}
