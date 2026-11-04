import { resolveDateInTimezone } from "./time";
import type { PostItem, SocialPost } from "../types";

export type SocialSubTab =
  | "calendario"
  | "ideas"
  | "mensajes"
  | "analytics"
  | "tableros"
  | "reportes"
  | "links";

const PARRILLAS_TABS = new Set<SocialSubTab>([
  "calendario",
  "ideas",
  "mensajes",
  "analytics",
  "tableros",
  "reportes",
  "links",
]);

/** Resuelve la sub-pestaña de /parrillas desde el parámetro `tab` de la URL (admite el alias `liga`). */
export function parseParrillasTab(tab: string | null | undefined): SocialSubTab | null {
  if (!tab) return null;
  if (tab === "liga" || tab === "links") return "links";
  return PARRILLAS_TABS.has(tab as SocialSubTab) ? (tab as SocialSubTab) : null;
}

/** Resuelve el identificador público de la bio-link de una marca (`bioLink.handle` o `slug`). */
export function resolveBrandBioHandle(
  brand: { slug?: string; bioLink?: { handle?: string } } | null | undefined
): string {
  return brand?.bioLink?.handle || brand?.slug || "";
}

/** Construye la URL pública de la bio-link de una marca a partir de su identificador. */
export function formatBrandBioUrl(handle: string): string {
  return `https://hubly.app/@${handle.replace(/^@/, "")}`;
}

/** Filtra los posts que pertenecen a la marca indicada. Sin `brandId` devuelve lista vacía. */
export function filterPostsByBrand<T extends { brandId: string }>(
  posts: readonly T[],
  brandId: string | null | undefined
): T[] {
  if (!brandId) return [];
  return posts.filter((post) => post.brandId === brandId);
}

/** Añade una entrada al historial del post. No guarda: eso lo hace la acción del store. */
export function withPostLog(post: SocialPost, text: string, author: string): SocialPost {
  const at = new Date().toISOString();
  const entry = { id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, author, text, at };
  return { ...post, activity: [entry, ...(post.activity || [])] };
}

/** Copia de un post como borrador: sin fecha, sin resultados ni actividad previa. */
export function duplicatePostAsDraft(source: SocialPost, id: string, author: string): SocialPost {
  return withPostLog(
    {
      ...source,
      id,
      title: `${source.title} (copia)`,
      status: "draft",
      statusLabel: "Borrador",
      scheduledDate: "",
      scheduledTime: "",
      comments: [],
      metrics: undefined,
      metricsSource: undefined,
      publishedUrl: undefined,
      chat: [],
      activity: [],
    },
    `Duplicó «${source.title}»`,
    author
  );
}

interface TodayPostsAndApprovalsResult {
  todayPosts: PostItem[];
  approvalPosts: PostItem[];
  pendingApprovals: PostItem[];
  changesRequestedPosts: PostItem[];
  todayCount: number;
  approvalsCount: number;
  isEmptyToday: boolean;
  isEmptyApprovals: boolean;
  todayIso: string;
}

export function isPostInApproval(post: PostItem): boolean {
  return (
    post.status === "pending" ||
    post.statusLabel === "En aprobación" ||
    (post.status as string) === "En aprobación"
  );
}

export function selectTodayPostsAndApprovals(
  posts: PostItem[],
  activeBrandId?: string | null,
  referenceNow?: string | Date | null,
  filterByBrand = true,
  timezone = "America/Mexico_City"
): TodayPostsAndApprovalsResult {
  const { isoDate: todayIso } = resolveDateInTimezone(referenceNow, timezone);

  const scoped =
    filterByBrand && activeBrandId
      ? posts.filter((p) => p.brandId === activeBrandId)
      : posts;

  const todayPosts = [...scoped]
    .filter((p) => p.scheduledDate === todayIso && p.status !== "draft")
    .sort((a, b) => (a.scheduledTime || "00:00").localeCompare(b.scheduledTime || "00:00"));

  const approvalPosts = [...scoped]
    .filter((p) => isPostInApproval(p))
    .sort((a, b) => (a.scheduledDate || "").localeCompare(b.scheduledDate || ""));

  const changesRequestedPosts = [...scoped].filter(
    (p) => p.status === "changes" || p.statusLabel === "Requiere cambios"
  );

  return {
    todayPosts,
    approvalPosts,
    pendingApprovals: approvalPosts,
    changesRequestedPosts,
    todayCount: todayPosts.length,
    approvalsCount: approvalPosts.length,
    isEmptyToday: todayPosts.length === 0,
    isEmptyApprovals: approvalPosts.length === 0,
    todayIso,
  };
}

export type AgendaViewMode = "lista" | "mes" | "marca";
export type EntryKind = "post" | "tarea" | "actividad";
export type RepeatMode = "none" | "daily" | "weekly" | "biweekly" | "monthly";

export interface CalendarActivity {
  id: string;
  brandId: string;
  isoDate: string;
  title: string;
  category: string;
  time: string;
  endTime?: string;
  allDay?: boolean;
  repeat?: RepeatMode;
  color?: string;
  place?: string;
}

export interface CalendarEntry {
  id: string;
  sourceId: string;
  kind: EntryKind;
  brandId: string;
  isoDate: string;
  title: string;
  label: string;
  time: string;
  networks: string[];
  format: string;
  color?: string;
}

interface CalendarEntriesFilter {
  showPosts: boolean;
  showActivities: boolean;
  brandFilter: readonly string[];
  networkFilter: readonly string[];
  formatFilter: readonly string[];
}

export const AGENDA_WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
export const AGENDA_NETWORKS = [
  "Instagram",
  "Facebook",
  "TikTok",
  "LinkedIn",
  "YouTube",
  "X",
  "Threads",
  "Pinterest",
] as const;
export const AGENDA_FORMATS = ["Imagen", "Video", "Carrusel", "Reel", "Story", "Solo texto"] as const;

export const REPEAT_OPTIONS: readonly { id: RepeatMode; label: string }[] = [
  { id: "none", label: "No se repite" },
  { id: "daily", label: "Diario" },
  { id: "weekly", label: "Semanal" },
  { id: "biweekly", label: "Quincenal" },
  { id: "monthly", label: "Mensual" },
];

export const DEFAULT_ACTIVITY_COLOR = "#94A3DD";
export const ACTIVITY_COLORS = [
  "#E59A9A",
  "#F2B37A",
  "#9BD08F",
  "#94A3DD",
  "#C6A2DF",
  "#7CC4C4",
] as const;

const parseIsoUtc = (iso: string): Date => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const toIsoUtc = (date: Date): string => date.toISOString().slice(0, 10);

function addDaysIso(iso: string, days: number): string {
  const date = parseIsoUtc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoUtc(date);
}

function mondayOfIso(iso: string): string {
  return addDaysIso(iso, -((parseIsoUtc(iso).getUTCDay() + 6) % 7));
}

export function formatAgendaDate(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("es-MX", { timeZone: "UTC", ...options }).format(parseIsoUtc(iso));
}

export function capitalizeText(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function expandActivityOccurrences(activity: CalendarActivity): string[] {
  const step = { daily: 1, weekly: 7, biweekly: 14 }[activity.repeat as "daily"];
  if (activity.repeat === "monthly") {
    return Array.from({ length: 24 }, (_, i) => {
      const date = parseIsoUtc(activity.isoDate);
      date.setUTCMonth(date.getUTCMonth() + i);
      return toIsoUtc(date);
    });
  }
  if (!step) return [activity.isoDate];
  return Array.from({ length: Math.ceil(730 / step) }, (_, i) => addDaysIso(activity.isoDate, i * step));
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [hour, minute] = time.split(":").map(Number);
  const total = (hour * 60 + minute + minutes) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function buildAgendaWeekDays(anchorIso: string): string[] {
  const weekStart = mondayOfIso(anchorIso);
  return Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i));
}

export function buildAgendaMonthCells(monthKey: string): string[] {
  const first = mondayOfIso(`${monthKey}-01`);
  const nextMonth = parseIsoUtc(`${monthKey}-01`);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const last = addDaysIso(toIsoUtc(nextMonth), -1);
  const cells: string[] = [];
  for (let day = first; day <= last || cells.length % 7 !== 0; day = addDaysIso(day, 1)) {
    cells.push(day);
  }
  return cells;
}

export function shiftAgendaAnchor(anchorIso: string, mode: AgendaViewMode, direction: 1 | -1): string {
  if (mode === "marca") {
    return addDaysIso(anchorIso, direction * 7);
  }
  const monthKey = anchorIso.slice(0, 7);
  const date = parseIsoUtc(`${monthKey}-01`);
  date.setUTCMonth(date.getUTCMonth() + direction);
  return toIsoUtc(date);
}

export function formatAgendaPeriodLabel(
  anchorIso: string,
  weekDays: readonly string[],
  mode: AgendaViewMode
): string {
  if (mode === "marca") {
    return `${formatAgendaDate(weekDays[0], { day: "numeric", month: "short" })} – ${formatAgendaDate(weekDays[6], { day: "numeric", month: "short" })} ${weekDays[6].slice(0, 4)}`;
  }
  return capitalizeText(formatAgendaDate(anchorIso, { month: "long", year: "numeric" }).replace(" de ", " "));
}

function matchesCalendarEntryFilter(entry: CalendarEntry, filter: CalendarEntriesFilter): boolean {
  if (entry.kind === "post" ? !filter.showPosts : !filter.showActivities) return false;
  if (filter.brandFilter.length > 0 && !filter.brandFilter.includes(entry.brandId)) return false;
  if (filter.networkFilter.length > 0 || filter.formatFilter.length > 0) {
    if (entry.kind !== "post") return false;
    if (
      filter.networkFilter.length > 0 &&
      !entry.networks.some((n) =>
        filter.networkFilter.some((f) => n.toLowerCase().includes(f.toLowerCase()))
      )
    ) {
      return false;
    }
    if (
      filter.formatFilter.length > 0 &&
      !filter.formatFilter.some((f) => f.toLowerCase() === entry.format.toLowerCase())
    ) {
      return false;
    }
  }
  return true;
}

export function buildCalendarEntries(
  posts: readonly SocialPost[],
  tasks: readonly { id: string; brandId: string; title: string; dueDate: string; completed?: boolean }[],
  activities: readonly CalendarActivity[],
  filter: CalendarEntriesFilter
): CalendarEntry[] {
  const postEntries: CalendarEntry[] = posts.map((post) => ({
    id: `post-${post.id}`,
    sourceId: post.id,
    kind: "post",
    brandId: post.brandId,
    isoDate: post.scheduledDate,
    title: post.title,
    label: post.format || "Post",
    time: post.scheduledTime || "",
    networks: (post.networks || []).map(String),
    format: String(post.format || ""),
  }));
  const taskEntries: CalendarEntry[] = tasks
    .filter((task) => !task.completed && task.dueDate)
    .map((task) => ({
      id: `task-${task.id}`,
      sourceId: task.id,
      kind: "tarea",
      brandId: task.brandId,
      isoDate: task.dueDate,
      title: task.title,
      label: "Tarea",
      time: "",
      networks: [],
      format: "",
    }));
  const activityEntries: CalendarEntry[] = activities.flatMap((activity) =>
    expandActivityOccurrences(activity).map((isoDate, index) => ({
      id: `${activity.id}-${index}`,
      sourceId: activity.id,
      kind: "actividad",
      brandId: activity.brandId,
      isoDate,
      title: activity.title,
      label: activity.category,
      time: activity.allDay ? "" : activity.time,
      networks: [],
      format: "",
      color: activity.color,
    }))
  );
  return [...postEntries, ...taskEntries, ...activityEntries]
    .filter((entry) => matchesCalendarEntryFilter(entry, filter))
    .sort((a, b) => (a.isoDate + a.time).localeCompare(b.isoDate + b.time));
}

export function groupEntriesByDay(entries: readonly CalendarEntry[]): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>();
  entries.forEach((entry) => map.set(entry.isoDate, [...(map.get(entry.isoDate) || []), entry]));
  return map;
}

export function countActiveCalendarFilters(filter: CalendarEntriesFilter): number {
  return (
    filter.brandFilter.length +
    filter.networkFilter.length +
    filter.formatFilter.length +
    (filter.showPosts ? 0 : 1) +
    (filter.showActivities ? 0 : 1)
  );
}
