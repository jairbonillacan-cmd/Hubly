import { addDays } from "./date";
import type { PostFormat, PostStatus, SocialNetwork, SocialPost } from "./types";

export const CALENDAR_TIME_ZONE = "America/Mexico_City";
export type CalendarView = "mes" | "semana" | "tabla" | "kanban";

/** Hoy en la zona de la agencia, sin depender de la zona del navegador. */
export function todayInZone(now: Date = new Date(), timeZone = CALENDAR_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

const weekdayIndex = (iso: string) => (new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7;

/** Días de lunes a domingo de la semana que contiene `iso`. */
export function weekDays(iso: string): string[] {
  const monday = addDaysUtc(iso, -weekdayIndex(iso));
  return Array.from({ length: 7 }, (_, i) => addDaysUtc(monday, i));
}

function addDaysUtc(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Cuadrícula de semanas completas que cubre el mes de `iso`, empezando en lunes. */
export function monthGrid(iso: string): string[] {
  const first = `${iso.slice(0, 7)}-01`;
  const start = addDaysUtc(first, -weekdayIndex(first));
  const [year, month] = first.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Math.ceil((weekdayIndex(first) + daysInMonth) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => addDaysUtc(start, i));
}

export function shiftPeriod(iso: string, view: CalendarView, direction: 1 | -1): string {
  if (view === "semana") return addDaysUtc(iso, 7 * direction);
  const [year, month] = iso.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + direction, 1));
  return target.toISOString().slice(0, 10);
}

const fmt = (iso: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-MX", { timeZone: "UTC", ...options });

/** El título sale del mismo intervalo que las columnas, también si la semana cruza meses o años. */
export function periodLabel(iso: string, view: CalendarView): string {
  if (view !== "semana") {
    const label = fmt(iso, { month: "long", year: "numeric" }).replace(" de ", " ");
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const days = weekDays(iso);
  const [start, end] = [days[0], days[6]];
  if (start.slice(0, 7) === end.slice(0, 7)) return `${Number(start.slice(8))} – ${fmt(end, { day: "numeric", month: "short", year: "numeric" })}`;
  if (start.slice(0, 4) === end.slice(0, 4)) return `${fmt(start, { day: "numeric", month: "short" })} – ${fmt(end, { day: "numeric", month: "short", year: "numeric" })}`;
  return `${fmt(start, { day: "numeric", month: "short", year: "numeric" })} – ${fmt(end, { day: "numeric", month: "short", year: "numeric" })}`;
}

export const inPeriod = (date: string, anchor: string, view: CalendarView) =>
  Boolean(date) && (view === "semana" ? weekDays(anchor).includes(date) : date.startsWith(anchor.slice(0, 7)));

export interface CalendarFilters {
  statuses: PostStatus[];
  networks: SocialNetwork[];
  formats: PostFormat[];
}

export const EMPTY_FILTERS: CalendarFilters = { statuses: [], networks: [], formats: [] };

export const filterPosts = (posts: SocialPost[], f: CalendarFilters) =>
  posts.filter(
    (p) =>
      (f.statuses.length === 0 || f.statuses.includes(p.status)) &&
      (f.formats.length === 0 || f.formats.includes(p.format)) &&
      (f.networks.length === 0 || p.networks.some((n) => f.networks.includes(n)))
  );

export type SortKey = "post" | "fecha" | "estatus" | "publicacion" | "formato";

export function sortPosts(posts: SocialPost[], key: SortKey, direction: "asc" | "desc", workflowName: (id?: string | null) => string): SocialPost[] {
  const value = (p: SocialPost) => {
    if (key === "post") return p.title.toLowerCase();
    if (key === "estatus") return workflowName(p.workflowStatusId).toLowerCase();
    if (key === "publicacion") return p.status;
    if (key === "formato") return p.format;
    return p.scheduledDate ? `${p.scheduledDate} ${p.scheduledTime}` : "";
  };
  // Los posts sin valor van al final en ambos sentidos.
  return [...posts].sort((a, b) => {
    const [x, y] = [value(a), value(b)];
    if (!x || !y) return x === y ? 0 : x ? -1 : 1;
    return direction === "asc" ? x.localeCompare(y, "es") : y.localeCompare(x, "es");
  });
}

/** Estado que se muestra: sin publicación automática, una fecha vencida pide registrar qué pasó. */
export function publicationLabel(post: Pick<SocialPost, "status" | "scheduledDate">, today: string): { label: string; tone: "muted" | "warn" | "info" | "ok" | "danger" } {
  switch (post.status) {
    case "published":
      return { label: "Publicado", tone: "ok" };
    case "scheduled":
      return post.scheduledDate && post.scheduledDate < today ? { label: "Pendiente de registrar", tone: "warn" } : { label: "Planificado", tone: "info" };
    case "approved":
      return { label: "Aprobado", tone: "ok" };
    case "pending":
      return { label: "En aprobación", tone: "warn" };
    case "changes":
      return { label: "Requiere cambios", tone: "danger" };
    default:
      return { label: "Borrador", tone: "muted" };
  }
}

export type KanbanGroup = "estatus" | "formato" | "responsable" | "publicacion" | `campo:${string}`;
export const PUBLICATION_COLUMNS: PostStatus[] = ["draft", "pending", "changes", "approved", "scheduled", "published"];
export const FORMAT_COLUMNS: PostFormat[] = ["Imagen", "Carrusel", "Reel / Video", "Story", "Texto"];

export const shiftDate = addDays;
