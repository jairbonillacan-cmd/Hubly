import { localIsoDate } from "@/lib/date";
import type { ChatMessage } from "@/lib/types";

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "👀", "✅", "👏", "🎉"] as const;

/** Canales que no vienen del espacio de trabajo: el general de la agencia y las notas propias. */
export const GENERAL_CHANNEL_ID = "ch-general";
export const SELF_CHANNEL_ID = "dm-self";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const GROUP_WINDOW_MS = 5 * 60_000;

export function timeLabel(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Día (YYYY-MM-DD) al que pertenece un mensaje; sin marca de tiempo cuenta como hoy. */
export function messageDay(m: Pick<ChatMessage, "createdAt">, today: string = localIsoDate()): string {
  return m.createdAt ? localIsoDate(new Date(m.createdAt)) : today;
}

export function dayLabel(iso: string, today: string = localIsoDate()): string {
  const diff = Math.round(
    (new Date(`${today}T12:00:00`).getTime() - new Date(`${iso}T12:00:00`).getTime()) / 86_400_000
  );
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  const d = new Date(`${iso}T12:00:00`);
  return `${capitalize(WEEKDAYS[d.getDay()])} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export interface ChatDayGroup {
  day: string;
  label: string;
  messages: ChatMessage[];
}

export function groupByDay(messages: ChatMessage[], today: string = localIsoDate()): ChatDayGroup[] {
  const groups: ChatDayGroup[] = [];
  for (const m of messages) {
    const day = messageDay(m, today);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.messages.push(m);
    else groups.push({ day, label: dayLabel(day, today), messages: [m] });
  }
  return groups;
}

/** Mensajes de un canal que no son respuestas, en el orden en que se guardaron. */
export function channelRoots(messages: ChatMessage[], channelId: string): ChatMessage[] {
  return messages.filter((m) => m.channelId === channelId && !m.parentId);
}

export function repliesOf(messages: ChatMessage[], parentId: string): ChatMessage[] {
  return messages.filter((m) => m.parentId === parentId);
}

export function replyCounts(messages: ChatMessage[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const m of messages) {
    if (m.parentId) counts.set(m.parentId, (counts.get(m.parentId) ?? 0) + 1);
  }
  return counts;
}

/** Un mensaje seguido del mismo autor, en el mismo día y a menos de cinco minutos, no repite cabecera. */
export function continuesPrevious(prev: ChatMessage | undefined, cur: ChatMessage): boolean {
  if (!prev || prev.sender !== cur.sender || prev.attachment || cur.attachment) return false;
  if (!prev.createdAt || !cur.createdAt) return false;
  return messageDay(prev) === messageDay(cur) && cur.createdAt - prev.createdAt < GROUP_WINDOW_MS;
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function matchesQuery(m: Pick<ChatMessage, "text" | "sender" | "attachment">, query: string): boolean {
  const q = normalize(query.trim());
  if (!q) return true;
  return normalize(`${m.sender} ${m.text} ${m.attachment?.title ?? ""}`).includes(q);
}

/** Devuelve las reacciones con `who` añadido o quitado de `emoji`; un emoji sin nadie desaparece. */
export function toggleReaction(
  reactions: Record<string, string[]> | undefined,
  emoji: string,
  who: string
): Record<string, string[]> {
  const next: Record<string, string[]> = { ...(reactions ?? {}) };
  const current = next[emoji] ?? [];
  const updated = current.includes(who) ? current.filter((n) => n !== who) : [...current, who];
  if (updated.length === 0) delete next[emoji];
  else next[emoji] = updated;
  return next;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
