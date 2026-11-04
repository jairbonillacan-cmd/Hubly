import type { CoverKind } from "./cover";

export type SocialNetwork =
  | "Instagram"
  | "TikTok"
  | "Facebook"
  | "LinkedIn"
  | "YouTube"
  | "X"
  | "Threads"
  | "Pinterest"
  | "Reddit"
  | "Google Business";

export type PostStatus =
  | "draft"
  | "pending"
  | "changes"
  | "approved"
  | "scheduled"
  | "published";

export type PostStatusLabel =
  | "Borrador"
  | "En aprobación"
  | "Aprobado"
  | "Programado"
  | "Publicado"
  | "Requiere cambios";

export type PostFormat = "Reel / Video" | "Carrusel" | "Imagen" | "Story" | "Texto";

export interface PostComment {
  id: string;
  author: string;
  role: "client" | "agency";
  text: string;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  brandId: string;
  title: string;
  caption: string;
  network?: SocialNetwork;
  networks: SocialNetwork[];
  format: PostFormat;
  cover: CoverKind;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: PostStatus;
  statusLabel?: PostStatusLabel;
  assignee: string;
  authorId?: string;
  approverName?: string;
  pillar: string;
  metrics?: {
    reach: number;
    likes: number;
    comments: number;
    saves: number;
    shares: number;
  };
  comments: PostComment[];
  mediaUrl?: string;
  publishedUrl?: string;
  metricsSource?: "manual";
  notifyOnPublish?: boolean;
  /** Miembros elegidos en «Avisar al publicar». */
  notifyMemberIds?: string[];
  notes?: string;
  todos?: PostTodo[];
  documents?: PostDocument[];
  chat?: PostChatMessage[];
  activity?: PostActivityEntry[];
  /** Hasta diez archivos en el orden de publicación; `mediaUrl` queda solo para posts antiguos. */
  media?: PostMedia[];
  platformSettings?: Partial<Record<SocialNetwork, PlatformSettings>>;
  /** Imagen de la biblioteca usada como portada del video. */
  coverAssetId?: string;
  /** De qué trata el video; manda sobre lo demás al generar el caption. */
  videoContext?: string;
  workflowStatusId?: string | null;
  assigneeIds?: string[];
  color?: string;
  customFields?: Record<string, string | number | boolean | null>;
}

/** `CoverKind` sin importar el componente en módulos que corren en el servidor. */
export type CoverKindValue = CoverKind;

export interface PostMedia {
  id: string;
  kind: "image" | "video";
  name: string;
  /** Archivo de la biblioteca; sin él, `url` contiene el dato heredado. */
  assetId?: string;
  url?: string;
}

export interface PlatformSettings {
  /** Con valor, esta red deja de heredar el copy general. */
  caption?: string;
  format?: PostFormat;
  title?: string;
  link?: string;
  boardName?: string;
  firstComment?: string;
  location?: string;
  /** Instagram: cuentas invitadas a la publicación en colaboración. */
  collaborators?: string[];
  /** TikTok: que la red elija la música del carrusel de fotos. */
  autoMusic?: boolean;
  tiktokPrivacy?: "PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY";
  allowComment?: boolean;
  allowDuet?: boolean;
  allowStitch?: boolean;
  commercial?: boolean;
  brandOrganic?: boolean;
  brandContent?: boolean;
  aiGenerated?: boolean;
  subreddit?: string;
  flair?: string;
  topicType?: "STANDARD" | "EVENT" | "OFFER";
  callToAction?: string;
  couponCode?: string;
  privacy?: string;
}

export interface WorkflowStatus {
  id: string;
  name: string;
  color: string;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: "text" | "number" | "select" | "date" | "url" | "checkbox";
  options?: { id: string; label: string; color: string }[];
}

export interface PostTodo {
  id: string;
  text: string;
  done: boolean;
  assigneeId?: string;
}

export interface PostDocument {
  id: string;
  name: string;
  url: string;
  folder?: string;
}

export interface PostChatMessage {
  id: string;
  author: string;
  text: string;
  at: string; // ISO
}

export interface PostActivityEntry {
  id: string;
  author: string;
  text: string;
  at: string; // ISO
}

export type PostExtrasPatch = Partial<
  Pick<SocialPost, "notes" | "todos" | "documents" | "chat">
>;

export interface ContentIdea {
  id: string;
  brandId: string;
  title: string;
  notes: string;
  pillar: string;
  createdAt: string; // ISO
  convertedPostId?: string;
}


export type PostItem = SocialPost;
