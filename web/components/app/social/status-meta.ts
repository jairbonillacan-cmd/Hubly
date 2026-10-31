import type { PostStatus } from "@/lib/types";

export const STATUS_META: Record<PostStatus, { label: string; bg: string; color: string }> = {
  draft: { label: "Borrador", bg: "#F1F5F9", color: "#475569" },
  pending: { label: "Esperando cliente", bg: "#E6F4FB", color: "#16324F" },
  changes: { label: "Cambios solicitados", bg: "#FEE2E2", color: "#B91C1C" },
  approved: { label: "Aprobado por cliente", bg: "#DCFCE7", color: "#15803D" },
  scheduled: { label: "Programado", bg: "#DBEAFE", color: "#1D4ED8" },
  published: { label: "Publicado", bg: "#DCFCE7", color: "#15803D" },
};
