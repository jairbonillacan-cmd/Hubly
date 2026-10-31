import type { PostFormat, SocialNetwork, SocialPost } from "./types";
import { NETWORKS } from "./network-catalog";

export const IMPORT_FIELDS = [
  { id: "title", label: "Título", aliases: ["titulo", "título", "title", "nombre", "post", "tema"] },
  { id: "caption", label: "Copy", aliases: ["copy", "caption", "texto", "descripcion", "descripción", "contenido"] },
  { id: "date", label: "Fecha", aliases: ["fecha", "date", "dia", "día", "publicacion", "publicación"] },
  { id: "time", label: "Hora", aliases: ["hora", "time"] },
  { id: "networks", label: "Redes", aliases: ["redes", "red", "network", "networks", "plataforma", "plataformas"] },
  { id: "format", label: "Formato", aliases: ["formato", "format", "tipo"] },
] as const;

export type ImportFieldId = (typeof IMPORT_FIELDS)[number]["id"];
export type ColumnMapping = Partial<Record<ImportFieldId, number>>;

/** Lee CSV o una tabla pegada: detecta tabulador, punto y coma o coma, y respeta comillas. */
export function parseDelimited(text: string): string[][] {
  const clean = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const firstLine = clean.split("\n", 1)[0] ?? "";
  const separator = ["\t", ";", ","].reduce((best, s) => (firstLine.split(s).length > firstLine.split(best).length ? s : best), ",");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i += 1) {
    const c = clean[i];
    if (quoted) {
      if (c === '"' && clean[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"' && cell === "") quoted = true;
    else if (c === separator) {
      row.push(cell.trim());
      cell = "";
    } else if (c === "\n") {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows.filter((r) => r.some((value) => value !== ""));
}

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const field of IMPORT_FIELDS) {
    const aliases = field.aliases.map(normalize);
    const index = headers.findIndex((h) => aliases.includes(normalize(h)));
    if (index >= 0) mapping[field.id] = index;
  }
  return mapping;
}

/** Admite ISO, día/mes/año y números de serie de Excel. Devuelve null si no es una fecha real. */
export function parseImportDate(value: string): string | null {
  const v = value.trim();
  const pad = (n: number) => String(n).padStart(2, "0");
  const build = (y: number, m: number, d: number) => {
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null;
  };
  let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return build(+m[1], +m[2], +m[3]);
  m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) return build(m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  if (/^\d{5}$/.test(v)) return new Date(Date.UTC(1899, 11, 30) + +v * 86400000).toISOString().slice(0, 10);
  return null;
}

const FORMAT_ALIASES: [RegExp, PostFormat][] = [
  [/reel|video|short/, "Reel / Video"],
  [/carrus|carousel/, "Carrusel"],
  [/story|histor/, "Story"],
  [/text/, "Texto"],
  [/imag|foto|post|feed/, "Imagen"],
];

function parseNetworks(value: string): { networks: SocialNetwork[]; unknown: string[] } {
  const networks: SocialNetwork[] = [];
  const unknown: string[] = [];
  for (const part of value.split(/[,;/|+]/).map((p) => p.trim()).filter(Boolean)) {
    const n = normalize(part);
    const found = NETWORKS.find((s) => normalize(s.id) === n || normalize(s.short) === n || (s.id === "X" && n === "twitter") || (s.id === "Google Business" && n.startsWith("google")));
    if (found) {
      if (!networks.includes(found.id)) networks.push(found.id);
    } else unknown.push(part);
  }
  return { networks, unknown };
}

export interface ImportRow {
  row: number;
  title: string;
  caption: string;
  date: string;
  time: string;
  networks: SocialNetwork[];
  format: PostFormat;
  errors: string[];
  duplicate: boolean;
}

/** Valida sin crear nada: la persona revisa cada fila antes de confirmar. */
export function reviewRows(
  rows: string[][],
  mapping: ColumnMapping,
  existing: Pick<SocialPost, "title" | "scheduledDate">[],
  brandNetworks: SocialNetwork[]
): ImportRow[] {
  const seen = new Set(existing.map((p) => `${normalize(p.title)}|${p.scheduledDate}`));
  return rows.map((cells, index) => {
    const get = (field: ImportFieldId) => (mapping[field] === undefined ? "" : (cells[mapping[field]!] ?? "").trim());
    const errors: string[] = [];
    const caption = get("caption");
    const title = get("title") || caption.slice(0, 60);
    if (!title) errors.push("Falta título o copy.");

    const rawDate = get("date");
    const date = rawDate ? parseImportDate(rawDate) : "";
    if (date === null) errors.push(`Fecha no válida: «${rawDate}».`);

    const rawTime = get("time");
    const time = /^\d{1,2}:\d{2}/.test(rawTime) ? rawTime.slice(0, 5).padStart(5, "0") : "";
    if (rawTime && !time) errors.push(`Hora no válida: «${rawTime}».`);

    const { networks, unknown } = parseNetworks(get("networks"));
    if (unknown.length) errors.push(`Red desconocida: ${unknown.join(", ")}.`);

    const rawFormat = normalize(get("format"));
    const format = rawFormat ? FORMAT_ALIASES.find(([re]) => re.test(rawFormat))?.[1] : "Imagen";
    if (!format) errors.push(`Formato desconocido: «${get("format")}».`);

    const key = `${normalize(title)}|${date ?? ""}`;
    const duplicate = Boolean(title) && seen.has(key);
    if (!errors.length) seen.add(key);

    return {
      row: index + 2,
      title,
      caption,
      date: date ?? "",
      time,
      networks: networks.length ? networks : brandNetworks.length ? [brandNetworks[0]] : ["Instagram"],
      format: format ?? "Imagen",
      errors,
      duplicate,
    };
  });
}
