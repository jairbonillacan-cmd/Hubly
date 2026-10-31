import type {
  CoverKindValue,
  PlatformSettings,
  PostChatMessage,
  PostDocument,
  PostFormat,
  PostMedia,
  PostStatus,
  PostTodo,
  SocialNetwork,
  SocialPost,
} from "./types";
import { mediaFileUrl } from "./media";

/** Todo lo editable de un post mientras el compositor está abierto. */
export interface PostDraft {
  postId: string | null;
  brandId: string;
  title: string;
  caption: string;
  networks: SocialNetwork[];
  format: PostFormat;
  cover: CoverKindValue;
  media: PostMedia[];
  platformSettings: Partial<Record<SocialNetwork, PlatformSettings>>;
  status: PostStatus;
  workflowStatusId: string | null;
  assigneeIds: string[];
  assignee: string;
  color: string;
  customFields: Record<string, string | number | boolean | null>;
  notifyOnPublish: boolean;
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
  todos: PostTodo[];
  documents: PostDocument[];
  chat: PostChatMessage[];
}

export function draftFromPost(
  post: SocialPost | null,
  defaults: { brandId: string; assignee: string; date?: string | null }
): PostDraft {
  return {
    postId: post?.id ?? null,
    brandId: post?.brandId ?? defaults.brandId,
    title: post?.title ?? "",
    caption: post?.caption ?? "",
    networks: post?.networks?.length ? post.networks : ["Instagram"],
    format: post?.format ?? "Imagen",
    cover: post?.cover ?? "steam",
    media: post?.media ?? [],
    platformSettings: post?.platformSettings ?? {},
    status: post?.status ?? "draft",
    workflowStatusId: post?.workflowStatusId ?? null,
    assigneeIds: post?.assigneeIds ?? [],
    assignee: post?.assignee ?? defaults.assignee,
    color: post?.color ?? "",
    customFields: post?.customFields ?? {},
    notifyOnPublish: post?.notifyOnPublish ?? false,
    scheduledDate: post?.scheduledDate ?? defaults.date ?? "",
    scheduledTime: post?.scheduledTime ?? "",
    notes: post?.notes ?? "",
    todos: post?.todos ?? [],
    documents: post?.documents ?? [],
    chat: post?.chat ?? [],
  };
}

const LEGACY_PREFIX = "heredado-";

/** Convierte el borrador en post. Solo un medio heredado conserva `mediaUrl`. */
export function draftToPost(draft: PostDraft, existing: SocialPost | null, fallbackAuthor: string) {
  const legacy = draft.media.find((m) => m.id.startsWith(LEGACY_PREFIX));
  return {
    id: draft.postId ?? undefined,
    brandId: draft.brandId,
    title: draft.title.trim() || "Sin título",
    caption: draft.caption.trim(),
    network: draft.networks[0],
    networks: draft.networks,
    format: draft.format,
    cover: draft.cover,
    media: draft.media,
    mediaUrl: legacy?.url,
    platformSettings: draft.platformSettings,
    workflowStatusId: draft.workflowStatusId,
    assigneeIds: draft.assigneeIds,
    color: draft.color || undefined,
    customFields: draft.customFields,
    notifyOnPublish: draft.notifyOnPublish,
    notes: draft.notes,
    todos: draft.todos,
    documents: draft.documents,
    chat: draft.chat,
    activity: existing?.activity,
    status: draft.status,
    scheduledDate: draft.scheduledDate,
    scheduledTime: draft.scheduledTime,
    assignee: draft.assignee || fallbackAuthor,
    pillar: existing?.pillar ?? "General",
  };
}

export const draftsEqual = (a: PostDraft, b: PostDraft) => JSON.stringify(a) === JSON.stringify(b);

/** El copy de una red, o el general mientras herede. */
export const captionFor = (draft: Pick<PostDraft, "caption" | "platformSettings">, network: SocialNetwork) =>
  draft.platformSettings[network]?.caption ?? draft.caption;

export const formatFor = (draft: Pick<PostDraft, "format" | "platformSettings">, network: SocialNetwork) =>
  draft.platformSettings[network]?.format ?? draft.format;

export const mediaItemUrl = (item: PostMedia, resolve: (assetId: string) => string = mediaFileUrl) =>
  item.assetId ? resolve(item.assetId) : item.url;

/** Primera imagen utilizable del post, para miniaturas de calendario y listas. */
export function postThumbnail(post: Pick<SocialPost, "media" | "mediaUrl">): { url: string; kind: "image" | "video" } | null {
  const first = post.media?.[0];
  if (first) {
    const url = mediaItemUrl(first);
    if (url) return { url, kind: first.kind };
  }
  return post.mediaUrl ? { url: post.mediaUrl, kind: "image" } : null;
}

// Recuperación local: el texto no sale del navegador hasta que la persona guarda.
const PREFIX = "hubly:borrador:";
export const recoveryKey = (owner: string, brandId: string, postId: string | null) =>
  `${PREFIX}${owner}:${brandId}:${postId ?? "nuevo"}`;

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export function saveRecovery(storage: DraftStorage, key: string, draft: PostDraft) {
  try {
    storage.setItem(key, JSON.stringify({ draft, savedAt: new Date().toISOString() }));
  } catch {}
}

export function loadRecovery(storage: DraftStorage, key: string): { draft: PostDraft; savedAt: string } | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as { draft: PostDraft; savedAt: string }) : null;
  } catch {
    return null;
  }
}

export function clearRecovery(storage: DraftStorage, key: string) {
  try {
    storage.removeItem(key);
  } catch {}
}

/** Al cerrar sesión no deben quedar borradores en un equipo compartido. */
export function clearAllRecoveries(storage: DraftStorage) {
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  } catch {}
}

export function hasRecovery(postId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      if (localStorage.key(i)?.startsWith(PREFIX) && localStorage.key(i)?.endsWith(`:${postId}`)) return true;
    }
  } catch {}
  return false;
}
