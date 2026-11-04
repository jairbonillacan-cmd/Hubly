import { resolveDateInTimezone } from "./time";
import type { PostItem, SocialPost } from "../types";

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
