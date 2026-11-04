import type { CoverKind } from "./cover";

export interface MediaAsset {
  id: string;
  brandId: string;
  name: string;
  kind: "video" | "image" | "pdf" | "doc";
  cover: CoverKind;
  sizeLabel: string;
  aiTags: string[];
  folder: string;
  uploadedAt: string;
  usedInPosts: number;
}

