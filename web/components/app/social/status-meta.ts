import { POST_STATUS_CLIENT_LABEL as L } from "@/lib/labels";
import type { PostStatus } from "@/lib/types";

export const STATUS_META: Record<PostStatus, { label: string; bg: string; color: string }> = {
  draft: { label: L.draft, bg: "#F1F5F9", color: "#475569" },
  pending: { label: L.pending, bg: "#E6F4FB", color: "#16324F" },
  changes: { label: L.changes, bg: "#FEE2E2", color: "#B91C1C" },
  approved: { label: L.approved, bg: "#DCFCE7", color: "#15803D" },
  scheduled: { label: L.scheduled, bg: "#DBEAFE", color: "#1D4ED8" },
  published: { label: L.published, bg: "#DCFCE7", color: "#15803D" },
};
