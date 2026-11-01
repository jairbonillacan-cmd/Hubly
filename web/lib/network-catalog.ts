import type { PlatformSettings, PostFormat, PostMedia, SocialNetwork } from "./types";

interface NetworkSpec {
  id: SocialNetwork;
  short: string;
  color: string;
  maxChars: number;
  maxHashtags: number;
  /** Caracteres visibles antes del «… más»; null si el feed muestra todo. */
  feedCut: number | null;
  formats: PostFormat[];
  maxMedia: number;
}

const ALL_FORMATS: PostFormat[] = ["Imagen", "Carrusel", "Reel / Video", "Story", "Texto"];

export const NETWORKS: NetworkSpec[] = [
  { id: "Instagram", short: "IG", color: "#E4405F", maxChars: 2200, maxHashtags: 30, feedCut: 125, formats: ["Imagen", "Carrusel", "Reel / Video", "Story"], maxMedia: 10 },
  { id: "Facebook", short: "FB", color: "#1877F2", maxChars: 63206, maxHashtags: 30, feedCut: 250, formats: ALL_FORMATS, maxMedia: 10 },
  { id: "TikTok", short: "TT", color: "#000000", maxChars: 2200, maxHashtags: 100, feedCut: 150, formats: ["Reel / Video", "Carrusel"], maxMedia: 10 },
  { id: "LinkedIn", short: "LI", color: "#0A66C2", maxChars: 3000, maxHashtags: 30, feedCut: 210, formats: ["Imagen", "Carrusel", "Reel / Video", "Texto"], maxMedia: 10 },
  { id: "YouTube", short: "YT", color: "#FF0000", maxChars: 5000, maxHashtags: 15, feedCut: 100, formats: ["Reel / Video"], maxMedia: 1 },
  { id: "X", short: "X", color: "#000000", maxChars: 280, maxHashtags: 10, feedCut: null, formats: ["Imagen", "Carrusel", "Reel / Video", "Texto"], maxMedia: 4 },
  { id: "Threads", short: "TH", color: "#000000", maxChars: 500, maxHashtags: 10, feedCut: 200, formats: ["Imagen", "Carrusel", "Reel / Video", "Texto"], maxMedia: 10 },
  { id: "Pinterest", short: "PI", color: "#E60023", maxChars: 500, maxHashtags: 20, feedCut: 100, formats: ["Imagen", "Reel / Video"], maxMedia: 1 },
  { id: "Reddit", short: "RD", color: "#FF4500", maxChars: 40000, maxHashtags: 0, feedCut: 300, formats: ["Imagen", "Carrusel", "Reel / Video", "Texto"], maxMedia: 10 },
  { id: "Google Business", short: "GB", color: "#4285F4", maxChars: 1500, maxHashtags: 0, feedCut: 250, formats: ["Imagen", "Texto"], maxMedia: 1 },
];

export const networkSpec = (id: SocialNetwork): NetworkSpec => NETWORKS.find((n) => n.id === id) ?? NETWORKS[0];

/** Cómo llama cada red a un mismo formato: una imagen en TikTok son «Fotos», un video en Instagram es «Reel». */
export function networkFormatLabel(network: SocialNetwork, format: PostFormat): string {
  const video = format === "Reel / Video";
  if (network === "Instagram" || network === "Facebook") {
    if (format === "Story") return "Story";
    if (video) return network === "Instagram" ? "Reel" : "Video";
    if (format === "Carrusel") return "Carrusel";
    return format === "Texto" ? "Solo texto" : "Post";
  }
  if (network === "TikTok") return format === "Story" ? "No publica Stories" : video ? "Video" : "Fotos";
  if (network === "YouTube") return "Short";
  if (network === "Google Business") {
    if (video || format === "Story") return "No acepta video";
    return format === "Texto" ? "Solo texto" : format === "Carrusel" ? "Primera imagen" : "Post";
  }
  if (format === "Texto") return "Solo texto";
  if (video) return "Video";
  return format === "Carrusel" && networkSpec(network).formats.includes("Carrusel") ? "Carrusel" : "Post";
}

export const countHashtags = (text: string) => (text.match(/#[\wáéíóúñÁÉÍÓÚÑ]+/g) ?? []).length;

type CaptionLevel = "ok" | "near" | "over";

/** Aviso al 90% y error al superar el límite de la red. */
export function captionLevel(length: number, maxChars: number): CaptionLevel {
  if (length > maxChars) return "over";
  return length > maxChars * 0.9 ? "near" : "ok";
}

/** Índice donde el feed corta el texto, por caracteres o por el tercer salto de línea. */
export function feedCutIndex(caption: string, network: SocialNetwork): number | null {
  const { feedCut } = networkSpec(network);
  let lineBreak = -1;
  for (let i = 0, found = 0; i < caption.length; i += 1) {
    if (caption[i] === "\n" && ++found === 3) {
      lineBreak = i;
      break;
    }
  }
  const byChars = feedCut !== null && caption.length > feedCut ? feedCut : -1;
  const cuts = [lineBreak, byChars].filter((n) => n >= 0);
  return cuts.length ? Math.min(...cuts) : null;
}

interface NetworkIssue {
  network: SocialNetwork;
  message: string;
}

/** Reglas que impedirían publicar en cada red; un borrador puede incumplirlas, planificarlo no. */
export function networkIssues(input: {
  networks: SocialNetwork[];
  caption: string;
  media: Pick<PostMedia, "kind">[];
  platformSettings?: Partial<Record<SocialNetwork, PlatformSettings>>;
}): NetworkIssue[] {
  const issues: NetworkIssue[] = [];
  const videos = input.media.filter((m) => m.kind === "video").length;
  const images = input.media.length - videos;
  for (const network of input.networks) {
    const spec = networkSpec(network);
    const settings = input.platformSettings?.[network];
    const text = settings?.caption ?? input.caption;
    const add = (message: string) => issues.push({ network, message });
    if (text.length > spec.maxChars) add(`El copy supera ${spec.maxChars.toLocaleString("es-MX")} caracteres.`);
    if (countHashtags(text) > spec.maxHashtags) {
      add(spec.maxHashtags === 0 ? "No admite hashtags." : `Admite hasta ${spec.maxHashtags} hashtags.`);
    }
    if (input.media.length > spec.maxMedia) add(`Admite hasta ${spec.maxMedia} archivo${spec.maxMedia === 1 ? "" : "s"}.`);
    if (network === "TikTok" && videos === 0 && images < 2) add("Necesita un video o un carrusel de fotos.");
    if (network === "YouTube" && videos === 0) add("Necesita un video.");
    if (network === "Instagram" && input.media.length === 0) add("Necesita al menos un archivo.");
    if (network === "Pinterest") {
      if (input.media.length === 0) add("Necesita una imagen o un video.");
      if (settings?.link && !/^https?:\/\//i.test(settings.link)) add("El enlace debe empezar con http:// o https://");
    }
    if (network === "Google Business" && videos > 0) add("No admite videos: usa imágenes.");
    if (network === "Reddit" && !settings?.title?.trim()) add("Necesita un título.");
    if (network === "TikTok" && settings?.commercial) {
      if (!settings.brandOrganic && !settings.brandContent) add("Indica si tu contenido te promociona a ti, a un tercero o a ambos.");
      if (settings.brandContent && settings.tiktokPrivacy === "SELF_ONLY") add("La visibilidad del contenido de marca no puede ser privada.");
    }
  }
  return issues;
}
