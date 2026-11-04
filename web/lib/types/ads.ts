import type { CoverKind } from "./cover";

export interface AdCreative {
  id: string;
  brandId: string;
  name: string;
  platform: "Meta" | "Google" | "TikTok";
  cover: CoverKind;
  status: "Activo" | "Pausado";
  spend: number;
  results: number;
  resultLabel: string;
  cpa: number;
  ctr: number;
  clickScore: number;
  hookScore: number;
}

/** Elemento del espacio de trabajo que se manda dentro de un mensaje. */
