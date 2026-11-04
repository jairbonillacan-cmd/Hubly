import { POST_STATUS_CLIENT_LABEL as L } from "@/lib/labels";
import type { PostStatus } from "@/lib/types";

export const STATUS_META: Record<PostStatus, { label: string; bg: string; color: string }> = {
  draft: { label: L.draft, bg: "var(--ui-muted)", color: "var(--ui-text-3)" },
  pending: { label: L.pending, bg: "var(--ui-accent-soft)", color: "var(--hb-accent-text)" },
  changes: { label: L.changes, bg: "var(--ui-danger-soft)", color: "var(--ui-danger-text)" },
  approved: { label: L.approved, bg: "var(--ui-success-soft)", color: "var(--ui-success-text)" },
  scheduled: { label: L.scheduled, bg: "var(--ui-sky-soft)", color: "var(--ui-sky-text)" },
  published: { label: L.published, bg: "var(--ui-success-soft)", color: "var(--ui-success-text)" },
};
