import { addDays } from "./date";
import { networkSpec } from "./network-catalog";
import type { PostFormat, PostMedia, SocialNetwork, SocialPost } from "./types";

export const MAX_COLLABORATORS = 3;
const INSTAGRAM_USER = /^[a-zA-Z0-9._]{1,30}$/;

/** Acepta @usuario, enlaces de perfil y varias cuentas pegadas de golpe. */
export function addCollaborators(raw: string, current: string[]): { list: string[]; error: string | null } {
  const list = [...current];
  let error: string | null = null;
  const names = raw
    .split(/[\s,]+/)
    .map((part) => (part.match(/instagram\.com\/([^/?#\s]+)/i)?.[1] ?? part).replace(/^@+/, "").trim())
    .filter(Boolean);
  for (const name of names) {
    if (list.length >= MAX_COLLABORATORS) {
      error = `Máximo ${MAX_COLLABORATORS} colaboradores.`;
      break;
    }
    if (!INSTAGRAM_USER.test(name)) {
      error = `«${name}» no parece un usuario de Instagram válido.`;
      continue;
    }
    if (!list.some((c) => c.toLowerCase() === name.toLowerCase())) list.push(name);
  }
  return { list, error };
}

type MediaKinds = Pick<PostMedia, "kind">[];
const ORDER: PostFormat[] = ["Imagen", "Carrusel", "Reel / Video", "Texto", "Story"];

/** Solo lo que alguna red elegida admite y lo que encaja con los archivos del post. */
export function availableFormats(networks: SocialNetwork[], media: MediaKinds): PostFormat[] {
  const hasVideo = media.some((m) => m.kind === "video");
  const hasImage = media.some((m) => m.kind === "image");
  return ORDER.filter((format) => {
    if (networks.length > 0 && !networks.some((n) => format === "Story" ? n === "Instagram" || n === "Facebook" : networkSpec(n).formats.includes(format))) return false;
    if (hasVideo && !hasImage) return format !== "Imagen" && format !== "Carrusel";
    if (hasImage && !hasVideo) return format !== "Reel / Video";
    return true;
  });
}

/** Corrige el formato cuando los archivos dejan de encajar con él. */
export function normalizeFormat(format: PostFormat, media: MediaKinds): PostFormat {
  const videos = media.filter((m) => m.kind === "video").length;
  const images = media.length - videos;
  if (videos > 0 && images === 0 && (format === "Imagen" || format === "Carrusel")) return "Reel / Video";
  if (images > 0 && videos === 0) {
    if (format === "Reel / Video") return images > 1 ? "Carrusel" : "Imagen";
    if (format === "Imagen" && images > 1) return "Carrusel";
  }
  return format;
}

export interface StoryRepeat {
  days: number[];
  endDate?: string;
}

const MAX_REPEATS = 12;

/** Fechas siguientes de una story que se repite, sin contar la primera. */
export function repeatDates(repeat: StoryRepeat, start: string): string[] {
  const dates: string[] = [];
  if (!start || repeat.days.length === 0) return dates;
  for (let i = 1; i <= 366 && dates.length < MAX_REPEATS; i += 1) {
    const iso = addDays(start, i);
    if (repeat.endDate && iso > repeat.endDate) break;
    if (repeat.days.includes(new Date(`${iso}T12:00:00`).getDay())) dates.push(iso);
  }
  return dates;
}

interface BestHour {
  day: number;
  dayName: string;
  hour: number;
  average: number;
  pieces: number;
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const hourLabel = (hour: number) => (hour === 0 ? "12 am" : hour < 12 ? `${hour} am` : hour === 12 ? "12 pm" : `${hour - 12} pm`);

/** Los tres momentos con mejor alcance promedio, según lo capturado en posts publicados. */
export function bestHours(posts: Pick<SocialPost, "status" | "metrics" | "scheduledDate" | "scheduledTime">[]): BestHour[] {
  const groups = new Map<string, { day: number; hour: number; total: number; pieces: number }>();
  for (const post of posts) {
    const reach = post.metrics?.reach ?? 0;
    if (post.status !== "published" || reach <= 0 || !post.scheduledDate || !post.scheduledTime) continue;
    const day = new Date(`${post.scheduledDate}T12:00:00`).getDay();
    const hour = Number(post.scheduledTime.split(":")[0]);
    const group = groups.get(`${day}-${hour}`) ?? { day, hour, total: 0, pieces: 0 };
    group.total += reach;
    group.pieces += 1;
    groups.set(`${day}-${hour}`, group);
  }
  return [...groups.values()]
    .map((g) => ({ day: g.day, dayName: DAY_NAMES[g.day], hour: g.hour, average: Math.round(g.total / g.pieces), pieces: g.pieces }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 3);
}

/** Próxima fecha en ese día de la semana, contando la de partida. */
export function nextWeekday(from: string, day: number): string {
  const current = new Date(`${from}T12:00:00`).getDay();
  return addDays(from, (day - current + 7) % 7);
}

export const isPastSchedule = (date: string, time: string, now: Date = new Date()) =>
  Boolean(date) && new Date(`${date}T${time || "23:59"}:00`).getTime() < now.getTime() - 60000;

/** Duración máxima que acepta cada red para este formato, o null si no aplica. */
export function videoLimit(network: SocialNetwork, format: PostFormat): { label: string; seconds: number } | null {
  if (network === "Instagram" && format === "Reel / Video") return { label: "Instagram Reel (3 min)", seconds: 180 };
  if (network === "TikTok") return { label: "TikTok (10 min)", seconds: 600 };
  if (network === "Facebook") return format === "Story" ? { label: "Facebook Story (120 s)", seconds: 120 } : { label: "Facebook (4 h)", seconds: 14400 };
  if (network === "YouTube") return { label: "YouTube Shorts (3 min)", seconds: 180 };
  return null;
}
