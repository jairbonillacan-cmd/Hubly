import {
  GENERAL_CHANNEL_ID,
  SELF_CHANNEL_ID,
  initialsOf,
  isDormant,
  matchesQuery,
} from "../chat";
import { dueLabelFor } from "../date";
import type {
  AgencyTask,
  ChatAttachment,
  ChatChannel,
  ChatMessage,
  SocialPost,
  TeamMember,
  WorkspaceProfile,
} from "../types";
import type { AddTaskInput } from "./tasks";

interface ChatPersonOption {
  id: string;
  name: string;
  initials: string;
}

interface ChatConversationItem {
  id: string;
  name: string;
  group: "agencia" | "marcas" | "directos";
  unread: number;
  muted: boolean;
  pinned: boolean;
  hidden: boolean;
  dormant: boolean;
  mentioned?: boolean;
  emoji?: string;
  initials: string;
  photo?: string;
  online?: boolean;
  type: ChatChannel["type"];
  stored?: ChatChannel;
}

interface BuildChatListItemsInput {
  channels: ChatChannel[];
  messages: ChatMessage[];
  muted: string[];
  pinnedChats: string[];
  hiddenChats: string[];
  myName: string;
  myInitials: string;
  myPhoto?: string;
  online: string[];
  now: number;
}

interface SelectChannelMembersInput {
  hasActive: boolean;
  isSelf: boolean;
  channel: ChatChannel | undefined;
  me: ChatPersonOption;
  people: ChatPersonOption[];
  team: TeamMember[];
  myName: string;
}

/** Indica si un mensaje de chat adjunta un archivo o una nota de voz. */
export function hasChatFileAttachment(m: ChatMessage): boolean {
  return m.attachment?.kind === "file" || m.attachment?.kind === "voice";
}

/** Filtra los mensajes de un canal que contienen archivos o notas de voz. */
export function selectChannelFiles(messages: ChatMessage[], channelId: string | null): ChatMessage[] {
  if (!channelId) return [];
  return messages.filter((m) => m.channelId === channelId && hasChatFileAttachment(m));
}

/** Devuelve los integrantes activos del equipo (excluyendo a la persona actual) para menciones y directos. */
export function selectChatPeople(
  team: TeamMember[],
  myName: string,
  myEmail?: string
): ChatPersonOption[] {
  return team
    .filter((m) => m.status === "Activo" && m.name !== myName && m.email !== myEmail)
    .map((m) => ({ id: m.id, name: m.name, initials: m.initials || initialsOf(m.name) }));
}

/** Construye la lista lateral de conversaciones combinando canales, preferencias y actividad. */
export function buildChatListItems({
  channels,
  messages,
  muted,
  pinnedChats,
  hiddenChats,
  myName,
  myInitials,
  myPhoto,
  online,
  now,
}: BuildChatListItemsInput): ChatConversationItem[] {
  const hasGeneral = channels.some((c) => c.type === "general");
  const base = hasGeneral
    ? []
    : [
        { id: GENERAL_CHANNEL_ID, name: "General", group: "agencia" as const, unread: 0, initials: "#", type: "general" as const },
        { id: SELF_CHANNEL_ID, name: `${myName} (tú)`, group: "directos" as const, unread: 0, initials: myInitials, photo: myPhoto, online: true, type: "self" as const },
      ];
  const fromStore = channels
    .filter((c) => !c.archived)
    .map((c) => {
      const self = c.type === "self";
      return {
        id: c.id,
        name: self ? `${myName} (tú)` : c.name.replace(/^#\s*/, ""),
        group:
          c.type === "brand"
            ? ("marcas" as const)
            : c.type === "agency" || c.type === "general"
              ? ("agencia" as const)
              : ("directos" as const),
        unread: c.unread,
        mentioned: c.mentioned,
        emoji: c.emoji,
        initials: self ? myInitials : initialsOf(c.name.replace(/\s*\(.*\)$/, "")),
        photo: self ? myPhoto : undefined,
        online: self || (c.memberId ? online.includes(c.memberId) : false),
        type: c.type,
        stored: c,
      };
    });
  return [...base, ...fromStore]
    .map((i) => {
      const stored = "stored" in i ? i.stored : undefined;
      return {
        ...i,
        muted: stored?.muted || muted.includes(i.id),
        pinned: stored?.listPinned || pinnedChats.includes(i.id),
        hidden: stored?.hidden || hiddenChats.includes(i.id),
        dormant: isDormant(messages, i.id, now),
      };
    })
    .sort((a, b) => Number(a.type === "self") - Number(b.type === "self"));
}

/** Filtra las conversaciones visibles por nombre o por coincidencia en sus mensajes. */
export function filterVisibleChatItems<T extends { id: string; name: string }>(
  items: T[],
  messages: ChatMessage[],
  listQuery: string
): T[] {
  const q = listQuery.trim();
  if (!q) return items;
  return items.filter(
    (i) =>
      matchesQuery({ text: i.name, sender: "" }, q) ||
      messages.some((m) => m.channelId === i.id && matchesQuery(m, q))
  );
}

/** Combina resultados locales y remotos de búsqueda de mensajes sin duplicar identificadores. */
export function mergeChatSearchResults(
  messages: ChatMessage[],
  remoteResults: ChatMessage[],
  listQuery: string
): ChatMessage[] {
  const q = listQuery.trim();
  if (q.length < 2) return [];
  const local = messages.filter((m) => m.text && matchesQuery({ text: m.text, sender: "" }, q));
  const seen = new Set(local.map((m) => m.id));
  return [...local, ...remoteResults.filter((m) => !seen.has(m.id))].slice(-12).reverse();
}

/** Calcula el subtítulo descriptivo del canal o conversación activa. */
export function resolveChatSubtitle(
  active: { group: "agencia" | "marcas" | "directos" } | null,
  channel: ChatChannel | undefined,
  brandName: string | undefined,
  isSelf: boolean
): string {
  if (!active) return "";
  if (channel?.description) return channel.description;
  if (active.group === "marcas") return `Canal de ${brandName ?? "la marca"}`;
  if (isSelf) return "Notas, borradores y recordatorios";
  if (active.group === "agencia") return "Canal de la agencia";
  return "Mensaje directo";
}

/** Determina qué personas participan en la conversación activa para el panel de detalles. */
export function selectChannelMembers({
  hasActive,
  isSelf,
  channel,
  me,
  people,
  team,
  myName,
}: SelectChannelMembersInput): ChatPersonOption[] {
  if (!hasActive) return [];
  if (isSelf) return [me];
  if (channel?.type === "direct") {
    return [me, ...people.filter((p) => p.id === channel.memberId || channel.name.startsWith(p.name))];
  }
  if (channel?.type === "brand") {
    return [
      me,
      ...team
        .filter((m) => m.status === "Activo" && m.name !== myName && m.brandIds?.includes(channel.brandId ?? ""))
        .map((m) => ({ id: m.id, name: m.name, initials: m.initials || initialsOf(m.name) })),
    ];
  }
  if (channel?.memberIds?.length) {
    return [me, ...people].filter((p) => channel.memberIds!.includes(p.id));
  }
  return [me, ...people];
}

/** Obtiene tareas sin completar y posts sin publicar compartidos en los mensajes raíz del canal. */
export function selectChannelPendingAttachments(
  roots: ChatMessage[],
  tasks: AgencyTask[],
  posts: SocialPost[]
): ChatAttachment[] {
  return roots
    .flatMap((m) => {
      const a = m.attachment;
      if (a?.kind === "task") {
        const task = tasks.find((t) => t.id === a.id);
        return task && !task.completed ? [a] : [];
      }
      if (a?.kind === "post") {
        const post = posts.find((p) => p.id === a.id);
        return post && post.status !== "published" ? [a] : [];
      }
      return [];
    })
    .filter((a, i, list) => list.findIndex((o) => o.kind === a.kind && o.id === a.id) === i);
}

/** Resuelve la ficha de perfil del autor de un mensaje para la tarjeta emergente. */
export function resolveMessagePerson(
  m: ChatMessage,
  myName: string,
  profile: Pick<WorkspaceProfile, "role" | "email"> | undefined,
  team: TeamMember[],
  online: string[]
) {
  if (m.isBot) return null;
  if (m.sender === myName) {
    return { name: myName, role: profile?.role, email: profile?.email, online: true, isSelf: true };
  }
  const member = team.find((t) => (m.senderId ? t.id === m.senderId : t.name === m.sender));
  if (!member) return null;
  return { name: member.name, role: member.role, email: member.email, online: online.includes(member.id) };
}

/** Construye los datos de una tarea nueva creada a partir de un mensaje del chat. */
export function buildTaskFromChatMessage(
  m: ChatMessage,
  channels: ChatChannel[],
  activeBrandId: string,
  myName: string,
  today: string
): AddTaskInput {
  const owner = channels.find((c) => c.id === m.channelId);
  return {
    brandId: owner?.brandId ?? activeBrandId,
    title: (m.text || m.attachment?.title || "Tarea desde el chat").slice(0, 90),
    description: m.text,
    dueDate: today,
    dueLabel: dueLabelFor(today, today),
    assignee: myName,
    listName: "Chat",
    status: "pendiente",
    priority: "Media",
  };
}
