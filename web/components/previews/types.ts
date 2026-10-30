import type { ReactNode } from "react";
import type { CoverKind } from "../Cover";

export type SocialPlatform = "instagram" | "tiktok" | "facebook" | "linkedin" | "youtube" | "x";

export type InstagramPostFormat = "feed" | "reel" | "carousel";
export type TikTokPostFormat = "video";
export type FacebookPostFormat = "feed" | "reel" | "link";
export type LinkedInPostFormat = "feed" | "carousel" | "article";

export type PostFormat =
  | InstagramPostFormat
  | TikTokPostFormat
  | FacebookPostFormat
  | LinkedInPostFormat
  | string;

export type PostStatus = "draft" | "pending" | "approved" | "changes" | "scheduled" | "published";

export type MediaAspectRatio = "1:1" | "4:5" | "9:16" | "16:9" | "1.91:1" | "auto";

export type MediaItem = {
  id?: string;
  type: "image" | "video" | "cover";
  url?: string;
  thumbnailUrl?: string;
  coverKind?: CoverKind;
  alt?: string;
  aspectRatio?: MediaAspectRatio;
  duration?: string; // e.g. "0:45"
  width?: number;
  height?: number;
};

export type PostAuthor = {
  name: string;
  handle: string;
  avatarUrl?: string;
  initials?: string;
  verified?: boolean;
  role?: string; // e.g. "Specialty Coffee Roasters • 12K followers"
  followersCount?: number | string;
};

export type ReactionType =
  | "like"
  | "love"
  | "care"
  | "haha"
  | "wow"
  | "sad"
  | "angry"
  | "celebrate"
  | "support"
  | "insightful"
  | "funny";

export type PostMetrics = {
  likes: number;
  comments: number;
  shares?: number;
  saves?: number;
  views?: number;
  reposts?: number;
  reactions?: Partial<Record<ReactionType, number>>;
};

export type AudioTrack = {
  title: string;
  artist?: string;
  isOriginal?: boolean;
  coverUrl?: string;
};

export type PostComment = {
  id: string;
  author: string;
  handle?: string;
  avatarUrl?: string;
  initials?: string;
  text: string;
  timeAgo?: string;
  likes?: number;
  isLiked?: boolean;
};

export type PostLinkPreview = {
  url: string;
  domain: string;
  title: string;
  description?: string;
  imageUrl?: string;
};

export type PreviewPost = {
  id: string;
  platform: SocialPlatform;
  format?: PostFormat;
  author: PostAuthor;
  content: string;
  media?: MediaItem[];
  audioTrack?: AudioTrack;
  location?: string;
  publishedAt?: string; // e.g. "hace 2 horas", "14 oct", "2026-10-30"
  metrics?: PostMetrics;
  tags?: string[];
  sponsored?: boolean;
  status?: PostStatus;
  cta?: {
    label: string;
    url?: string;
    domain?: string;
  };
  linkPreview?: PostLinkPreview;
  comments?: PostComment[];
};

export type PreviewAction =
  | "like"
  | "comment"
  | "share"
  | "save"
  | "repost"
  | "more"
  | "profile"
  | "audio"
  | "approve"
  | "request_changes";

export type PreviewConfig = {
  interactive?: boolean;
  mode?: "feed" | "reel";
  showStatusBadge?: boolean;
  showMetrics?: boolean;
  showActions?: boolean;
  showHeader?: boolean;
  showComments?: boolean;
  maxCaptionLength?: number;
  theme?: "light" | "dark" | "system";
  scale?: "sm" | "md" | "lg" | "responsive";
  className?: string;
  style?: React.CSSProperties;
  onStatusChange?: (newStatus: PostStatus) => void;
  onAction?: (action: PreviewAction, post: PreviewPost) => void;
  headerRightSlot?: ReactNode;
  footerSlot?: ReactNode;
};

export type PlatformPreviewProps = {
  post: PreviewPost;
  config?: PreviewConfig;
  className?: string;
  style?: React.CSSProperties;
};
