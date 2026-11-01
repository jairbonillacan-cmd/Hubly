import { localIsoDate } from "@/lib/date";
import type { ChatMessage } from "@/lib/types";

export const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "👀", "✅", "👏", "🎉"] as const;
export const MORE_REACTIONS = ["🙌", "💪", "🙏", "😍", "🤔", "😅", "😮", "😢", "🤝", "💡", "🚀", "⭐", "💯", "📌", "🎯", "☕", "🥳", "😎", "🤩", "👌", "🙈", "❌", "⏰", "📣"] as const;

/** Canales que no vienen del espacio de trabajo: el general de la agencia y las notas propias. */
export const GENERAL_CHANNEL_ID = "ch-general";
export const SELF_CHANNEL_ID = "dm-self";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const GROUP_WINDOW_MS = 5 * 60_000;

/** Hora en formato de 12 horas: «12:02 p.m.». */
export function timeLabel(d: Date): string {
  const hours = d.getHours();
  return `${hours % 12 || 12}:${String(d.getMinutes()).padStart(2, "0")} ${hours < 12 ? "a.m." : "p.m."}`;
}

/** Los mensajes de ejemplo solo guardan «HH:mm». */
export function messageTime(m: Pick<ChatMessage, "createdAt" | "time">): string {
  if (m.createdAt) return timeLabel(new Date(m.createdAt));
  const match = /^(\d{1,2}):(\d{2})$/.exec(m.time);
  if (!match) return m.time;
  const d = new Date();
  d.setHours(Number(match[1]), Number(match[2]));
  return timeLabel(d);
}

/** Día (YYYY-MM-DD) al que pertenece un mensaje; sin marca de tiempo cuenta como hoy. */
function messageDay(m: Pick<ChatMessage, "createdAt">, today: string = localIsoDate()): string {
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

interface ChatDayGroup {
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

const DORMANT_MS = 14 * 86_400_000;

/** Sin mensajes en dos semanas. Un canal sin historial no cuenta: sigue a la vista para empezarlo. */
export function isDormant(messages: ChatMessage[], channelId: string, now: number): boolean {
  const own = messages.filter((m) => m.channelId === channelId);
  if (own.length === 0) return false;
  return own.every((m) => m.createdAt !== undefined && now - m.createdAt > DORMANT_MS);
}

/** Primera fecha futura de una serie, conservando la hora y sin saltar de mes a fin de mes. */
export function nextOccurrence(from: number, repeat: "weekly" | "monthly", now: number): number {
  const start = new Date(from);
  const day = start.getDate();
  let next = new Date(from);
  let steps = 0;
  while (next.getTime() <= now) {
    steps += 1;
    next = new Date(from);
    if (repeat === "weekly") {
      next.setDate(day + steps * 7);
    } else {
      next.setDate(1);
      next.setMonth(start.getMonth() + steps);
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(day, lastDay));
    }
  }
  return next.getTime();
}

function at(base: Date, days: number, hour: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

interface TimeChoice {
  label: string;
  at: number;
}

/** Atajos para programar un mensaje; «Hoy» solo aparece si aún no pasan las 6 p.m. */
export function scheduleChoices(now: Date): TimeChoice[] {
  const choices: TimeChoice[] = [];
  const evening = at(now, 0, 18);
  if (evening > now) choices.push({ label: "Hoy a las 6 p.m.", at: evening.getTime() });
  choices.push({ label: "Mañana a las 9 a.m.", at: at(now, 1, 9).getTime() });
  const toMonday = ((8 - now.getDay()) % 7) || 7;
  if (toMonday !== 1) choices.push({ label: "El lunes a las 9 a.m.", at: at(now, toMonday, 9).getTime() });
  return choices;
}

export function reminderChoices(now: Date): TimeChoice[] {
  return [{ label: "En 1 hora", at: now.getTime() + 3_600_000 }, ...scheduleChoices(now)];
}

export function scheduledLabel(sendAt: number, today: string = localIsoDate()): string {
  const d = new Date(sendAt);
  return `${dayLabel(localIsoDate(d), today)}, ${timeLabel(d)}`;
}

/** Palabra tras la última @ antes del cursor, o null si no se está mencionando a nadie. */
export function mentionQuery(text: string, caret: number): string | null {
  const match = /(?:^|\s)@([\p{L}\p{N}._-]*)$/u.exec(text.slice(0, caret));
  return match ? match[1] : null;
}

export function insertMention(text: string, caret: number, name: string): { text: string; caret: number } {
  const before = text.slice(0, caret).replace(/@[\p{L}\p{N}._-]*$/u, `@${name} `);
  return { text: before + text.slice(caret), caret: before.length };
}

type MessageSegment = { kind: "text" | "mention" | "link"; value: string };

/** Separa menciones de personas conocidas y enlaces web; todo lo demás queda como texto. */
export function messageSegments(text: string, names: string[]): MessageSegment[] {
  const escaped = [...names]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const mention = escaped.length ? `@(?:${escaped.join("|")})(?![\\p{L}\\p{N}])|` : "";
  const pattern = new RegExp(`${mention}https?://[^\\s<>]+`, "giu");
  const segments: MessageSegment[] = [];
  let last = 0;
  for (const found of text.matchAll(pattern)) {
    const start = found.index;
    if (start > last) segments.push({ kind: "text", value: text.slice(last, start) });
    segments.push({ kind: found[0].startsWith("@") ? "mention" : "link", value: found[0] });
    last = start + found[0].length;
  }
  if (last < text.length) segments.push({ kind: "text", value: text.slice(last) });
  return segments;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
